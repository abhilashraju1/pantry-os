import { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { getDatabase } from '@pantryos/database';

export const integrationRoutes: FastifyPluginAsync = async (fastify) => {
  // Beckn RET11 on_search response mock
  fastify.post('/integrations/ondc/search', async (request) => {
    const { transactionId } = request.body as { transactionId: string };
    const db = await getDatabase();

    const dishesRes = await db.execute(sql`
      SELECT d.id, d.name_en, d.description_en, v.price_paise
      FROM dishes d
      JOIN dish_variants v ON d.id = v.dish_id
      WHERE d.is_active = true
    `);
    const dishes = (dishesRes as any).rows || dishesRes;

    return {
      context: {
        domain: 'ONDC:RET11',
        country: 'IND',
        city: 'std:080',
        action: 'on_search',
        core_version: '1.2.0',
        transaction_id: transactionId || `txn_${Date.now()}`,
        timestamp: new Date().toISOString()
      },
      message: {
        catalog: {
          bpp_descriptor: {
            name: 'Mandya Traditional Pantries - VV Puram',
            symbol: '/demo-media/branding/logo.svg'
          },
          bpp_providers: [
            {
              id: 'branch-blr-vvp-01',
              descriptor: { name: 'VV Puram Food Street Branch' },
              items: dishes.map((d: any) => ({
                id: d.id,
                descriptor: { name: d.name_en, short_desc: d.description_en },
                price: { currency: 'INR', value: (d.price_paise / 100).toFixed(2) },
                tags: [{ code: 'veg', list: [{ code: 'veg', value: 'yes' }] }]
              }))
            }
          ]
        }
      }
    };
  });

  // Normalized Mock Incoming Order (ONDC / Swiggy / Zomato) with Deduplication
  fastify.post('/integrations/mock-order', async (request, reply) => {
    const { provider, providerOrderId, items, customerName, totalPaise } = request.body as {
      provider: string;
      providerOrderId: string;
      items: Array<{ dishVariantId: string; quantity: number }>;
      customerName?: string;
      totalPaise?: number;
    };

    if (!provider || !providerOrderId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'provider and providerOrderId are required' }
      });
    }

    const db = await getDatabase();

    // Deduplication check: check if order with this provider order ID already exists
    const existingRes = await db.execute(sql`
      SELECT id, order_number, channel, status, total_paise
      FROM orders
      WHERE notes LIKE ${'%' + providerOrderId + '%'}
      LIMIT 1
    `);
    const existing = ((existingRes as any).rows || existingRes)?.[0];

    if (existing) {
      return {
        success: true,
        deduplicated: true,
        data: {
          order: existing,
          message: `Order ${providerOrderId} already processed (idempotent replay)`
        }
      };
    }

    // Call internal order creation
    const orderId = 'ord-' + crypto.randomUUID();
    const orderNum = `ORD-${provider.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const channel = provider === 'ONDC' ? 'MOCK_ONDC' : provider === 'SWIGGY' ? 'MOCK_SWIGGY' : 'MOCK_ZOMATO';

    await db.execute(sql`
      INSERT INTO orders (id, branch_id, order_number, channel, status, customer_name, subtotal_paise, tax_paise, total_paise, payment_status, notes)
      VALUES (
        ${orderId}, 'branch-blr-vvp-01', ${orderNum}, ${channel}, 'ACCEPTED',
        ${customerName || provider + ' Customer'}, ${totalPaise || 9000}, 0, ${totalPaise || 9000}, 'PAID',
        ${`Provider: ${provider}, ID: ${providerOrderId}`}
      )
    `);

    return {
      success: true,
      deduplicated: false,
      data: {
        order: { id: orderId, orderNumber: orderNum, status: 'ACCEPTED', providerOrderId }
      }
    };
  });

  // Mock Cancellation
  fastify.post('/integrations/mock-cancel', async (request, reply) => {
    const { providerOrderId, reason } = request.body as { providerOrderId: string; reason?: string };
    const db = await getDatabase();

    const orderRes = await db.execute(sql`
      SELECT id, status FROM orders WHERE notes LIKE ${'%' + providerOrderId + '%'} LIMIT 1
    `);
    const order = ((orderRes as any).rows || orderRes)?.[0];

    if (!order) {
      return reply.status(404).send({ success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }

    await db.execute(sql`
      UPDATE orders
      SET status = 'CANCELLED',
          notes = COALESCE(notes, '') || ' | Cancelled: ' || ${reason || 'Customer request'}
      WHERE id = ${order.id}
    `);

    return {
      success: true,
      data: { id: order.id, status: 'CANCELLED', reason }
    };
  });
};
