import { FastifyPluginAsync } from 'fastify';
import { store } from '../store/memory-store.js';
import { calculateOrderTotals, canTransitionOrder } from '@pantryos/business-rules';
import { wsHub } from '../ws/hub.js';
import { OrderChannel, OrderItem } from '@pantryos/contracts';

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/orders', async () => {
    return {
      success: true,
      data: { orders: store.orders }
    };
  });

  fastify.post('/orders', async (request, reply) => {
    const {
      channel,
      tableSessionToken,
      customerName,
      customerPhone,
      requestedPickupAt,
      items: rawItems,
      notes
    } = request.body as {
      channel: OrderChannel;
      tableSessionToken?: string;
      customerName?: string;
      customerPhone?: string;
      requestedPickupAt?: string;
      items: Array<{ dishVariantId: string; quantity: number; specialInstructions?: string }>;
      notes?: string;
    };

    let tableId: string | null = null;
    let tableNumber: string | null = null;

    if (channel === 'QR_TABLE' && tableSessionToken) {
      const token = tableSessionToken.replace('sess_', '');
      const table = store.tables.find((t) => t.qrToken === token);
      if (table) {
        tableId = table.id;
        tableNumber = table.tableNumber;
      }
    }

    let subtotalPaise = 0;
    const orderItems: OrderItem[] = [];

    // Atomic reservation & cost derivation
    for (const raw of rawItems) {
      let foundDish = null;
      let foundVariant = null;

      for (const dish of store.dishes) {
        const v = dish.variants.find((v) => v.id === raw.dishVariantId);
        if (v) {
          foundDish = dish;
          foundVariant = v;
          break;
        }
      }

      if (!foundDish || !foundVariant) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_VARIANT', message: `Dish variant ${raw.dishVariantId} does not exist` }
        });
      }

      // Check and allocate ready batch
      let allocatedBatchId: string | null = null;
      if (foundDish.preparationPolicy === 'READY_BATCH') {
        const batch = store.batches.find(
          (b) => b.dishId === foundDish.id && (b.status === 'READY' || b.status === 'HOLDING')
        );

        const neededAmount = raw.quantity * foundVariant.portionQuantity;
        if (!batch || (batch.remainingUsableYield || 0) < neededAmount) {
          return reply.status(409).send({
            success: false,
            error: {
              code: 'INSUFFICIENT_BATCH_PORTIONS',
              message: `Not enough portions of ${foundDish.nameEn} available.`
            }
          });
        }

        batch.remainingUsableYield = (batch.remainingUsableYield || 0) - neededAmount;
        allocatedBatchId = batch.id;
      }

      const itemTotal = foundVariant.pricePaise * raw.quantity;
      subtotalPaise += itemTotal;

      orderItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        orderId: '',
        dishId: foundDish.id,
        dishNameEn: foundDish.nameEn,
        dishNameKn: foundDish.nameKn,
        variantId: foundVariant.id,
        variantNameEn: foundVariant.nameEn,
        variantNameKn: foundVariant.nameKn,
        quantity: raw.quantity,
        unitPricePaise: foundVariant.pricePaise,
        subtotalPaise: itemTotal,
        specialInstructions: raw.specialInstructions,
        allocatedBatchId,
        status: 'PENDING'
      });
    }

    const packagingFee = channel === 'PHONE_PICKUP' || channel === 'MOCK_ONDC' ? orderItems.length * 500 : 0;
    const totals = calculateOrderTotals({
      itemSubtotalPaise: subtotalPaise,
      packagingFeePaise: packagingFee,
      gstRatePercent: store.branch.gstRatePercent
    });

    const orderId = `ord-${Date.now()}`;
    for (const item of orderItems) {
      item.orderId = orderId;
    }

    const newOrder = {
      id: orderId,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      branchId: store.branch.id,
      channel,
      status: channel === 'QR_TABLE' ? ('PLACED' as const) : ('ACCEPTED' as const),
      tableId,
      tableNumber,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      items: orderItems,
      subtotalPaise: totals.subtotalPaise,
      taxPaise: totals.taxPaise,
      packagingFeePaise: totals.packagingFeePaise,
      totalPaise: totals.totalPaise,
      paymentStatus: 'UNPAID' as const,
      requestedPickupAt: requestedPickupAt || null,
      promisedReadyAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      placedAt: new Date().toISOString(),
      completedAt: null,
      notes: notes || null
    };

    store.orders.unshift(newOrder);

    wsHub.broadcast({
      type: 'ORDER_CREATED',
      branchId: store.branch.id,
      timestamp: new Date().toISOString(),
      payload: { order: newOrder }
    });

    return {
      success: true,
      data: { order: newOrder }
    };
  });

  fastify.post('/orders/:id/accept', async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = store.orders.find((o) => o.id === id);

    if (!order) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order does not exist' }
      });
    }

    if (!canTransitionOrder(order.status, 'ACCEPTED')) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_STATE_TRANSITION', message: `Cannot accept order in state ${order.status}` }
      });
    }

    order.status = 'ACCEPTED';

    wsHub.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      branchId: store.branch.id,
      timestamp: new Date().toISOString(),
      payload: { order }
    });

    return {
      success: true,
      data: { order }
    };
  });

  fastify.post('/orders/:id/packed', async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = store.orders.find((o) => o.id === id);
    if (!order) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });

    order.status = 'PACKED';

    wsHub.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      branchId: store.branch.id,
      timestamp: new Date().toISOString(),
      payload: { order }
    });

    return { success: true, data: { order } };
  });

  fastify.post('/orders/:id/handoff', async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = store.orders.find((o) => o.id === id);
    if (!order) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });

    order.status = 'COMPLETED';
    order.completedAt = new Date().toISOString();

    wsHub.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      branchId: store.branch.id,
      timestamp: new Date().toISOString(),
      payload: { order }
    });

    return { success: true, data: { order } };
  });
};
