import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from './server.js';

describe('PantryOS Fastify API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns healthy status', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('healthy');
    expect(body.branch).toBe('BLR-VVP-01');
  });

  it('POST /api/v1/auth/login validates credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@pantryos.local', password: 'password123' }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.user.fullName).toBe('Suresh Kumar');
  });

  it('POST /api/v1/auth/table-session validates table QR token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/table-session',
      payload: { tableToken: 'token_t1_98a7f' }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.tableNumber).toBe('T1');
  });

  it('GET /api/v1/menu returns dynamic dish availability', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/menu' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.dishes.length).toBe(3);
    const bbb = body.data.dishes.find((d: any) => d.code === 'DISH-BBB');
    expect(bbb.availablePortions).toBeGreaterThan(0);
  });

  it('POST /api/v1/equipment/acquire-lock enforces exclusive lock', async () => {
    // Acquire lock on Burner 1
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/equipment/acquire-lock',
      payload: {
        equipmentId: 'eq-burner-1',
        taskId: 'task-test-01',
        durationMinutes: 15
      }
    });
    expect(res1.statusCode).toBe(200);

    // Second overlapping attempt on Burner 1 must be rejected with 409 Conflict
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/equipment/acquire-lock',
      payload: {
        equipmentId: 'eq-burner-1',
        taskId: 'task-test-02',
        durationMinutes: 15
      }
    });
    expect(res2.statusCode).toBe(409);
    const body2 = JSON.parse(res2.body);
    expect(body2.error.code).toBe('STOVE_OCCUPIED_CONFLICT');

    // Release lock
    await app.inject({
      method: 'POST',
      url: '/api/v1/equipment/release-lock',
      payload: { equipmentId: 'eq-burner-1' }
    });
  });

  it('POST /api/v1/orders places order and atomically reserves batch portions', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      payload: {
        channel: 'WALK_IN_POS',
        customerName: 'Vinod Hegde',
        items: [
          {
            dishVariantId: 'var-bbb-reg', // Bisi Bele Bath
            quantity: 2
          }
        ]
      }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.order.items[0].quantity).toBe(2);
    expect(body.data.order.paymentStatus).toBe('UNPAID');

    // Pay for order
    const payRes = await app.inject({
      method: 'POST',
      url: '/api/v1/payments',
      payload: {
        orderId: body.data.order.id,
        amountPaise: body.data.order.totalPaise,
        method: 'UPI_QR'
      }
    });
    expect(payRes.statusCode).toBe(200);
    const payBody = JSON.parse(payRes.body);
    expect(payBody.data.order.paymentStatus).toBe('PAID');
  });
});
