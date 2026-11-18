import { FastifyPluginAsync } from 'fastify';
import { store } from '../store/memory-store.js';
import { PaymentMethod } from '@pantryos/contracts';
import { wsHub } from '../ws/hub.js';

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/payments', async (request, reply) => {
    const { orderId, amountPaise, method, transactionRef } = request.body as {
      orderId: string;
      amountPaise: number;
      method: PaymentMethod;
      transactionRef?: string;
    };

    const order = store.orders.find((o) => o.id === orderId);
    if (!order) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' }
      });
    }

    order.paymentStatus = 'PAID';

    if (method === 'CASH') {
      store.cashSession.expectedCashPaise += amountPaise;
    }

    wsHub.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      branchId: store.branch.id,
      timestamp: new Date().toISOString(),
      payload: { order }
    });

    return {
      success: true,
      data: {
        payment: {
          id: `pay-${Date.now()}`,
          orderId,
          amountPaise,
          method,
          status: 'PAID',
          transactionRef: transactionRef || `TXN-${Date.now().toString().slice(-6)}`,
          verifiedAt: new Date().toISOString()
        },
        order
      }
    };
  });

  fastify.get('/shifts/current', async () => {
    return {
      success: true,
      data: { shift: store.cashSession }
    };
  });

  fastify.post('/shifts/close', async (request, reply) => {
    const { countedCashPaise, notes } = request.body as {
      countedCashPaise: number;
      notes?: string;
    };

    store.cashSession.closingCashPaise = countedCashPaise;
    store.cashSession.variancePaise = countedCashPaise - store.cashSession.expectedCashPaise;
    store.cashSession.closedAt = new Date().toISOString();
    store.cashSession.notes = notes || null;

    return {
      success: true,
      data: { shift: store.cashSession }
    };
  });
};
