import { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { getDatabase } from '@pantryos/database';

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  // Record payment
  fastify.post('/payments', async (request, reply) => {
    const { orderId, amountPaise, method, transactionRef, cashierUserId, branchId } = request.body as {
      orderId: string;
      amountPaise: number;
      method: string;
      transactionRef?: string;
      cashierUserId?: string;
      branchId?: string;
    };

    if (!orderId || !amountPaise || !method) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'orderId, amountPaise, and method are required' }
      });
    }

    const db = await getDatabase();
    const orderRes = await db.execute(sql`SELECT id, total_paise, payment_status FROM orders WHERE id = ${orderId}`);
    const order = ((orderRes as any).rows || orderRes)?.[0];

    if (!order) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order does not exist' }
      });
    }

    if (order.payment_status === 'PAID') {
      return reply.status(400).send({
        success: false,
        error: { code: 'ORDER_ALREADY_PAID', message: 'This order is already fully paid' }
      });
    }

    const paymentId = 'pay-' + crypto.randomUUID();
    const bId = branchId || 'branch-blr-vvp-01';
    const txRef = transactionRef || `TXN-${Date.now()}`;

    // Find active cash session if cash
    let cashSessionId: string | null = null;
    if (method === 'CASH') {
      const csRes = await db.execute(sql`
        SELECT id FROM cash_sessions
        WHERE branch_id = ${bId} AND closed_at IS NULL
        ORDER BY opened_at DESC
        LIMIT 1
      `);
      cashSessionId = ((csRes as any).rows || csRes)?.[0]?.id || null;
    }

    await db.transaction(async (tx: any) => {
      // 1. Insert payment record
      await tx.execute(sql`
        INSERT INTO payments (id, branch_id, order_id, cash_session_id, amount_paise, method, status, transaction_ref, verified_at, verified_by_user_id)
        VALUES (${paymentId}, ${bId}, ${orderId}, ${cashSessionId}, ${amountPaise}, ${method}, 'PAID', ${txRef}, NOW(), ${cashierUserId || 'usr-cash-01'})
      `);

      // 2. Mark order as PAID
      await tx.execute(sql`
        UPDATE orders
        SET payment_status = 'PAID'
        WHERE id = ${orderId}
      `);
    });

    return {
      success: true,
      data: {
        payment: { id: paymentId, orderId, amountPaise, method, status: 'PAID', transactionRef: txRef },
        order: { id: orderId, paymentStatus: 'PAID' }
      }
    };
  });

  // Current cash drawer session
  fastify.get('/cash-sessions/current', async () => {
    const db = await getDatabase();
    const result = await db.execute(sql`
      SELECT id, branch_id, cashier_user_id, opening_cash_paise, closing_cash_paise,
             counted_cash_paise, variance_paise, opened_at, closed_at
      FROM cash_sessions
      WHERE closed_at IS NULL
      ORDER BY opened_at DESC
      LIMIT 1
    `);
    const session = ((result as any).rows || result)?.[0] || null;
    return { success: true, data: { session } };
  });

  // Open cash drawer session
  fastify.post('/cash-sessions/open', async (request, reply) => {
    const { openingCashPaise, cashierUserId, branchId } = request.body as any;
    const db = await getDatabase();
    const id = 'csess-' + crypto.randomUUID();
    const bId = branchId || 'branch-blr-vvp-01';

    await db.execute(sql`
      INSERT INTO cash_sessions (id, branch_id, cashier_user_id, opening_cash_paise)
      VALUES (${id}, ${bId}, ${cashierUserId || 'usr-cash-01'}, ${openingCashPaise || 200000})
    `);

    return { success: true, data: { id, openingCashPaise: openingCashPaise || 200000 } };
  });

  // Close cash drawer session with variance reconciliation
  fastify.post('/cash-sessions/close', async (request, reply) => {
    const { sessionId, countedCashPaise, notes } = request.body as any;
    const db = await getDatabase();

    const csRes = await db.execute(sql`
      SELECT id, opening_cash_paise FROM cash_sessions WHERE id = ${sessionId} LIMIT 1
    `);
    const cs = ((csRes as any).rows || csRes)?.[0];
    if (!cs) {
      return reply.status(404).send({ success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
    }

    // Sum cash payments during this session
    const payRes = await db.execute(sql`
      SELECT COALESCE(SUM(amount_paise), 0)::int as total_cash
      FROM payments
      WHERE cash_session_id = ${sessionId} AND status = 'PAID'
    `);
    const totalCashCollected = ((payRes as any).rows || payRes)?.[0]?.total_cash || 0;
    const expectedClosingCash = cs.opening_cash_paise + totalCashCollected;
    const variancePaise = (countedCashPaise || expectedClosingCash) - expectedClosingCash;

    await db.execute(sql`
      UPDATE cash_sessions
      SET closing_cash_paise = ${expectedClosingCash},
          counted_cash_paise = ${countedCashPaise || expectedClosingCash},
          variance_paise = ${variancePaise},
          closed_at = NOW(),
          notes = ${notes || null}
      WHERE id = ${sessionId}
    `);

    return {
      success: true,
      data: {
        sessionId,
        openingCashPaise: cs.opening_cash_paise,
        totalCashCollected,
        expectedClosingCash,
        countedCashPaise: countedCashPaise || expectedClosingCash,
        variancePaise
      }
    };
  });
};
