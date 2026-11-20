import { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { getDatabase } from '@pantryos/database';
import { calculateKitchenFireTime, calculateOrderTotals, canTransitionOrder } from '@pantryos/business-rules';
import { OrderChannel } from '@pantryos/contracts';

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all orders
  fastify.get('/orders', async () => {
    const db = await getDatabase();
    const ordersRes = await db.execute(sql`
      SELECT o.id, o.order_number as "orderNumber", o.channel, o.status,
             o.table_id as "tableId", t.table_number as "tableNumber",
             o.customer_name as "customerName", o.customer_phone as "customerPhone",
             o.subtotal_paise as "subtotalPaise", o.tax_paise as "taxPaise",
             o.packaging_fee_paise as "packagingFeePaise", o.total_paise as "totalPaise",
             o.payment_status as "paymentStatus",
             o.requested_pickup_at as "requestedPickupAt",
             o.promised_ready_at as "promisedReadyAt",
             o.placed_at as "placedAt",
             o.completed_at as "completedAt",
             o.notes
      FROM orders o
      LEFT JOIN dining_tables t ON o.table_id = t.id
      ORDER BY o.placed_at DESC
    `);
    const orders = (ordersRes as any).rows || ordersRes;

    const itemsRes = await db.execute(sql`
      SELECT oi.id, oi.order_id as "orderId", oi.dish_id as "dishId",
             oi.variant_id as "variantId", oi.quantity,
             oi.unit_price_paise as "unitPricePaise",
             oi.subtotal_paise as "subtotalPaise",
             oi.special_instructions as "specialInstructions",
             oi.allocated_batch_id as "allocatedBatchId",
             oi.status,
             d.name_en as "dishNameEn", d.name_kn as "dishNameKn",
             v.name_en as "variantNameEn", v.name_kn as "variantNameKn"
      FROM order_items oi
      JOIN dishes d ON oi.dish_id = d.id
      JOIN dish_variants v ON oi.variant_id = v.id
    `);
    const items = (itemsRes as any).rows || itemsRes;

    const fullOrders = orders.map((o: any) => ({
      ...o,
      items: items.filter((i: any) => i.orderId === o.id)
    }));

    return { success: true, data: { orders: fullOrders } };
  });

  // Place order with atomic cart reservation
  fastify.post('/orders', async (request, reply) => {
    const {
      channel,
      tableSessionToken,
      customerName,
      customerPhone,
      requestedPickupAt,
      items: rawItems,
      notes,
      branchId
    } = request.body as {
      channel: OrderChannel;
      tableSessionToken?: string;
      customerName?: string;
      customerPhone?: string;
      requestedPickupAt?: string;
      items: Array<{ dishVariantId: string; quantity: number; specialInstructions?: string }>;
      notes?: string;
      branchId?: string;
    };

    if (!rawItems || rawItems.length === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'EMPTY_CART', message: 'Order must contain at least one item' }
      });
    }

    const db = await getDatabase();
    const bId = branchId || 'branch-blr-vvp-01';
    let tableId: string | null = null;
    let tableSessionId: string | null = null;

    // Validate table session if QR_TABLE
    if (channel === 'QR_TABLE') {
      if (!tableSessionToken) {
        return reply.status(400).send({
          success: false,
          error: { code: 'MISSING_SESSION', message: 'Table session token required for QR orders' }
        });
      }

      // Check session
      const sessRes = await db.execute(sql`
        SELECT ts.id, ts.table_id, ts.status, dt.table_number
        FROM table_sessions ts
        JOIN dining_tables dt ON ts.table_id = dt.id
        WHERE ts.session_token = ${tableSessionToken}
        LIMIT 1
      `);
      const session = ((sessRes as any).rows || sessRes)?.[0];

      if (!session) {
        return reply.status(404).send({
          success: false,
          error: { code: 'INVALID_SESSION', message: 'Table session not found' }
        });
      }

      if (session.status === 'CLOSED') {
        return reply.status(403).send({
          success: false,
          error: { code: 'SESSION_CLOSED', message: 'This table session has ended. Please scan again.' }
        });
      }

      tableId = session.table_id;
      tableSessionId = session.id;
    }

    try {
      const orderId = 'ord-' + crypto.randomUUID();
      const orderNum = `ORD-${Date.now().toString().slice(-8)}`;

      // Execute atomic cart validation and reservation in a single transaction
      const createdOrder = await db.transaction(async (tx: any) => {
        let subtotalPaise = 0;
        const processedItems: any[] = [];

        for (const raw of rawItems) {
          // 1. Fetch variant and dish
          const vRes = await tx.execute(sql`
            SELECT v.id, v.dish_id, v.name_en, v.name_kn, v.portion_quantity::float as portion_quantity,
                   v.price_paise, d.preparation_policy, d.name_en as dish_name_en, d.name_kn as dish_name_kn
            FROM dish_variants v
            JOIN dishes d ON v.dish_id = d.id
            WHERE v.id = ${raw.dishVariantId}
            LIMIT 1
          `);
          const v = ((vRes as any).rows || vRes)?.[0];

          if (!v) {
            throw new Error(`INVALID_VARIANT: Dish variant ${raw.dishVariantId} does not exist`);
          }

          let allocatedBatchId: string | null = null;
          const neededAmount = raw.quantity * v.portion_quantity;

          // 2. Check & reserve based on policy
          if (v.preparation_policy === 'READY_BATCH') {
            const batchRes = await tx.execute(sql`
              SELECT id, remaining_usable_yield::float as remaining_yield
              FROM production_batches
              WHERE dish_id = ${v.dish_id}
                AND (status = 'READY' OR status = 'HOLDING')
                AND (expires_at IS NULL OR expires_at > NOW())
                AND (quality_core_temperature_c IS NULL OR quality_core_temperature_c >= 60.0)
                AND remaining_usable_yield >= ${neededAmount}
              ORDER BY expires_at ASC
              LIMIT 1
              FOR UPDATE
            `);
            const batch = ((batchRes as any).rows || batchRes)?.[0];

            if (!batch) {
              throw new Error(`INSUFFICIENT_STOCK: Not enough portions of ${v.dish_name_en} available`);
            }

            // Deduct yield
            await tx.execute(sql`
              UPDATE production_batches
              SET remaining_usable_yield = remaining_usable_yield - ${neededAmount}
              WHERE id = ${batch.id}
            `);

            // Insert reservation
            await tx.execute(sql`
              INSERT INTO batch_reservations (id, batch_id, order_item_id, portions_reserved, quantity_deducted, unit, status)
              VALUES (${'res-' + crypto.randomUUID()}, ${batch.id}, ${orderId}, ${raw.quantity}, ${neededAmount}, 'g', 'RESERVED')
            `);

            allocatedBatchId = batch.id;
          } else if (v.preparation_policy === 'FRESH_ORDER') {
            // Check rice flour: 120g per 2 rottis
            const flourNeeded = raw.quantity * 120;
            const flourRes = await tx.execute(sql`
              SELECT id, current_stock::float as current_stock
              FROM ingredients
              WHERE id = 'ing-rice-flour' OR code = 'ING-003'
              LIMIT 1
              FOR UPDATE
            `);
            const flour = ((flourRes as any).rows || flourRes)?.[0];

            if (!flour || flour.current_stock < flourNeeded) {
              throw new Error(`INSUFFICIENT_STOCK: Not enough rice flour for fresh Akki Rotti`);
            }

            await tx.execute(sql`
              UPDATE ingredients
              SET current_stock = current_stock - ${flourNeeded}
              WHERE id = ${flour.id}
            `);

            await tx.execute(sql`
              INSERT INTO stock_movements (id, branch_id, ingredient_id, movement_type, quantity, reason)
              VALUES (${'mov-' + crypto.randomUUID()}, ${bId}, ${flour.id}, 'RESERVATION', ${flourNeeded}, 'Fresh Akki Rotti order deduction')
            `);
          }

          const lineTotal = v.price_paise * raw.quantity;
          subtotalPaise += lineTotal;

          processedItems.push({
            id: 'item-' + crypto.randomUUID(),
            orderId,
            dishId: v.dish_id,
            variantId: v.id,
            dishNameEn: v.dish_name_en,
            dishNameKn: v.dish_name_kn,
            variantNameEn: v.name_en,
            variantNameKn: v.name_kn,
            quantity: raw.quantity,
            unitPricePaise: v.price_paise,
            subtotalPaise: lineTotal,
            specialInstructions: raw.specialInstructions || null,
            allocatedBatchId,
            status: 'PENDING'
          });
        }

        // 3. Scheduling and pricing calculations
        const taxPaise = Math.round(subtotalPaise * 0.05); // 5% GST
        const packagingFeePaise = channel === 'PHONE_PICKUP' ? 1000 : 0; // ₹10 packaging fee
        const totalPaise = subtotalPaise + taxPaise + packagingFeePaise;

        let promisedReadyAt: string | null = null;
        if (requestedPickupAt) {
          const schedule = calculateKitchenFireTime({
            requestedPickupTime: new Date(requestedPickupAt),
            cookDurationMinutes: 10,
            packingDurationMinutes: 5,
            bufferMinutes: 5
          });
          promisedReadyAt = schedule.targetReadyTime.toISOString();
        }

        // 4. Insert order
        await tx.execute(sql`
          INSERT INTO orders (
            id, branch_id, order_number, channel, status, table_id, table_session_id,
            customer_name, customer_phone, subtotal_paise, tax_paise, packaging_fee_paise,
            total_paise, payment_status, requested_pickup_at, promised_ready_at, notes
          )
          VALUES (
            ${orderId}, ${bId}, ${orderNum}, ${channel}, 'ACCEPTED', ${tableId}, ${tableSessionId},
            ${customerName || null}, ${customerPhone || null}, ${subtotalPaise}, ${taxPaise}, ${packagingFeePaise},
            ${totalPaise}, 'UNPAID', ${requestedPickupAt || null}, ${promisedReadyAt}, ${notes || null}
          )
        `);

        // 5. Insert order items
        for (const item of processedItems) {
          await tx.execute(sql`
            INSERT INTO order_items (
              id, order_id, dish_id, variant_id, quantity, unit_price_paise, subtotal_paise,
              special_instructions, allocated_batch_id, status
            )
            VALUES (
              ${item.id}, ${item.orderId}, ${item.dishId}, ${item.variantId}, ${item.quantity},
              ${item.unitPricePaise}, ${item.subtotalPaise}, ${item.specialInstructions},
              ${item.allocatedBatchId}, ${item.status}
            )
          `);
        }

        return {
          id: orderId,
          orderNumber: orderNum,
          channel,
          status: 'ACCEPTED',
          tableId,
          customerName,
          subtotalPaise,
          taxPaise,
          packagingFeePaise,
          totalPaise,
          paymentStatus: 'UNPAID',
          requestedPickupAt,
          promisedReadyAt,
          items: processedItems
        };
      });

      return {
        success: true,
        data: { order: createdOrder }
      };
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.startsWith('INSUFFICIENT_STOCK')) {
        return reply.status(409).send({
          success: false,
          error: { code: 'INSUFFICIENT_STOCK', message: msg.replace('INSUFFICIENT_STOCK: ', '') }
        });
      }
      if (msg.startsWith('INVALID_VARIANT')) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_VARIANT', message: msg.replace('INVALID_VARIANT: ', '') }
        });
      }
      return reply.status(500).send({
        success: false,
        error: { code: 'ORDER_ERROR', message: msg }
      });
    }
  });

  // Table Bill Request
  fastify.post('/orders/request-bill', async (request, reply) => {
    const { tableSessionToken } = request.body as { tableSessionToken: string };
    const db = await getDatabase();

    await db.execute(sql`
      UPDATE table_sessions
      SET status = 'BILL_REQUESTED',
          bill_requested_at = NOW()
      WHERE session_token = ${tableSessionToken}
    `);

    return { success: true, message: 'Bill requested. Cashier notified.' };
  });

  // Cashier Acknowledge Bill
  fastify.post('/orders/acknowledge-bill', async (request, reply) => {
    const { tableId, cashierUserId } = request.body as { tableId: string; cashierUserId?: string };
    const db = await getDatabase();

    await db.execute(sql`
      UPDATE table_sessions
      SET bill_acknowledged_at = NOW(),
          bill_acknowledged_by_user_id = ${cashierUserId || 'usr-cash-01'}
      WHERE table_id = ${tableId} AND status = 'BILL_REQUESTED'
    `);

    return { success: true, message: 'Bill acknowledged by cashier' };
  });

  // Close Table Session
  fastify.post('/orders/close-table-session', async (request, reply) => {
    const { tableId } = request.body as { tableId: string };
    const db = await getDatabase();

    await db.execute(sql`
      UPDATE table_sessions
      SET status = 'CLOSED',
          closed_at = NOW()
      WHERE table_id = ${tableId} AND status != 'CLOSED'
    `);

    return { success: true, message: 'Table session closed and table vacated' };
  });

  // Mark packed & deduct packaging material
  fastify.post('/orders/:id/packed', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = await getDatabase();

    const orderRes = await db.execute(sql`SELECT id, status, channel FROM orders WHERE id = ${id}`);
    const order = ((orderRes as any).rows || orderRes)?.[0];

    if (!order) {
      return reply.status(404).send({ success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    if (order.status === 'PACKED') {
      return { success: true, message: 'Order already packed' };
    }

    await db.transaction(async (tx: any) => {
      await tx.execute(sql`UPDATE orders SET status = 'PACKED' WHERE id = ${id}`);
      // Deduct 1 packaging container per packed parcel
      await tx.execute(sql`
        UPDATE ingredients
        SET current_stock = GREATEST(0, current_stock - 1)
        WHERE id = 'ing-pkg-container'
      `);
      await tx.execute(sql`
        INSERT INTO stock_movements (id, branch_id, ingredient_id, movement_type, quantity, reason)
        VALUES (${'mov-' + crypto.randomUUID()}, 'branch-blr-vvp-01', 'ing-pkg-container', 'PACKING_USE', 1, ${'Order packing ' + id})
      `);
    });

    return { success: true, data: { id, status: 'PACKED' } };
  });

  // Complete handoff
  fastify.post('/orders/:id/handoff', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = await getDatabase();

    const orderRes = await db.execute(sql`SELECT id, channel, status FROM orders WHERE id = ${id}`);
    const order = ((orderRes as any).rows || orderRes)?.[0];

    if (!order) {
      return reply.status(404).send({ success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    const nextStatus = order.channel === 'QR_TABLE' ? 'SERVED' : 'COMPLETED';
    await db.execute(sql`
      UPDATE orders
      SET status = ${nextStatus},
          completed_at = NOW()
      WHERE id = ${id}
    `);

    return { success: true, data: { id, status: nextStatus } };
  });

  // Cancel order & release batch / ingredient reservations
  fastify.post('/orders/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = (request.body as { reason?: string }) || {};
    const db = await getDatabase();

    const orderRes = await db.execute(sql`SELECT id, status FROM orders WHERE id = ${id}`);
    const order = ((orderRes as any).rows || orderRes)?.[0];

    if (!order) {
      return reply.status(404).send({ success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    if (order.status === 'CANCELLED') {
      return reply.status(400).send({ success: false, error: { code: 'ALREADY_CANCELLED', message: 'Order is already cancelled' } });
    }

    if (order.status === 'COMPLETED' || order.status === 'SERVED') {
      return reply.status(400).send({ success: false, error: { code: 'CANNOT_CANCEL', message: `Cannot cancel order in ${order.status} state` } });
    }

    await db.transaction(async (tx: any) => {
      // 1. Mark order cancelled
      await tx.execute(sql`
        UPDATE orders
        SET status = 'CANCELLED',
            notes = COALESCE(notes, '') || ' | Cancelled: ' || ${reason || 'Operator cancellation'}
        WHERE id = ${id}
      `);

      // 2. Find and release batch reservations
      const reservationsRes = await tx.execute(sql`
        SELECT id, batch_id, quantity_deducted::float as quantity_deducted
        FROM batch_reservations
        WHERE order_item_id = ${id} AND status = 'RESERVED'
      `);
      const reservations = (reservationsRes as any).rows || reservationsRes;

      for (const res of reservations) {
        await tx.execute(sql`
          UPDATE production_batches
          SET remaining_usable_yield = remaining_usable_yield + ${res.quantity_deducted}
          WHERE id = ${res.batch_id}
        `);

        await tx.execute(sql`
          UPDATE batch_reservations
          SET status = 'CANCELLED'
          WHERE id = ${res.id}
        `);
      }

      // 3. Return flour if fresh order
      const itemsRes = await tx.execute(sql`
        SELECT oi.quantity, d.preparation_policy
        FROM order_items oi
        JOIN dishes d ON oi.dish_id = d.id
        WHERE oi.order_id = ${id}
      `);
      const items = (itemsRes as any).rows || itemsRes;
      for (const item of items) {
        if (item.preparation_policy === 'FRESH_ORDER') {
          const flourReturn = item.quantity * 120;
          await tx.execute(sql`
            UPDATE ingredients
            SET current_stock = current_stock + ${flourReturn}
            WHERE id = 'ing-rice-flour' OR code = 'ING-003'
          `);
        }
      }
    });

    return { success: true, data: { id, status: 'CANCELLED', reason } };
  });
};
