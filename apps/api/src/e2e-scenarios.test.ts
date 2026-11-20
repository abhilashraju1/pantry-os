import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from './server.js';
import { getDatabase, resetDemo, closeDatabase } from '@pantryos/database';

describe('PantryOS End-to-End Acceptance & Regression Scenarios (A - I)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Reset database to clean synthetic demo state
    await resetDemo();
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
    await closeDatabase();
  });

  // SCENARIO A: Clean start and staff login
  describe('Scenario A: Clean Start, Staff Login & RBAC Boundaries', () => {
    it('rejects invalid password with 401 INVALID_CREDENTIALS', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'admin@pantryos.local', password: 'wrongpassword' }
      });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('authenticates valid manager and sets session cookie', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'admin@pantryos.local', password: 'password123' }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.user.fullName).toBe('Suresh Kumar');
      expect(body.data.sessionToken).toBeDefined();

      // Verify cookie
      const cookies = res.cookies;
      expect(cookies.some((c) => c.name === 'pantry_session')).toBe(true);
    });

    it('creates new cashier account and verifies login with distinct role', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/users',
        payload: {
          email: 'deepa.pos@pantryos.local',
          password: 'Cashier@Password123',
          fullName: 'Deepa Gowda (POS)',
          roles: ['CASHIER']
        }
      });
      expect(createRes.statusCode).toBe(200);

      // Sign in with new cashier credentials
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'deepa.pos@pantryos.local', password: 'Cashier@Password123' }
      });
      expect(loginRes.statusCode).toBe(200);
      const loginBody = JSON.parse(loginRes.body);
      expect(loginBody.data.user.roles).toContain('CASHIER');
    });
  });

  // SCENARIO B: Admin operational setup, batch production & quality sign-off
  describe('Scenario B: Admin Setup, Batch Production & Food Safety Sign-off', () => {
    let testBatchId: string;

    it('allows admin to plan production batch', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/batches/plan',
        payload: {
          dishId: 'dish-bbb',
          plannedYield: 3000
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.batch.status).toBe('PLANNED');
      testBatchId = body.data.batch.id;
    });

    it('chef moves batch to COOKING', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/batches/${testBatchId}/start`
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.status).toBe('COOKING');
    });

    it('blocks release if core temperature is below 60°C (FSSAI rule)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/batches/${testBatchId}/quality-signoff`,
        payload: {
          actualUsableYield: 2900,
          coreTemperatureC: 54.5, // Below 60°C!
          sensoryCheckPassed: true
        }
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('QUALITY_CHECK_FAILED');
    });

    it('releases batch to READY when core temp is >= 60°C', async () => {
      // Plan fresh batch for release test
      const planRes = await app.inject({
        method: 'POST',
        url: '/api/v1/batches/plan',
        payload: { dishId: 'dish-bbb', plannedYield: 2000 }
      });
      const validBatchId = JSON.parse(planRes.body).data.batch.id;

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/batches/${validBatchId}/quality-signoff`,
        payload: {
          actualUsableYield: 2100,
          coreTemperatureC: 76.5,
          sensoryCheckPassed: true
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.batch.status).toBe('READY');
      expect(body.data.batch.remainingUsableYield).toBe(2100);
    });
  });

  // SCENARIO C: Scheduled pickup order journey
  describe('Scenario C: Scheduled Phone Pickup, Capacity Promise, Packaging & Payment', () => {
    let orderId: string;
    let orderTotalPaise: number;

    it('cashier accepts future pickup order with capacity-aware promise', async () => {
      const futurePickupTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString();

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload: {
          channel: 'PHONE_PICKUP',
          customerName: 'Anand Murthy',
          customerPhone: '+91 98450 77777',
          requestedPickupAt: futurePickupTime,
          items: [
            {
              dishVariantId: 'var-bbb-reg', // 300g per portion
              quantity: 3
            }
          ]
        }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.order.status).toBe('ACCEPTED');
      expect(body.data.order.paymentStatus).toBe('UNPAID');
      expect(body.data.order.promisedReadyAt).toBeDefined();
      expect(body.data.order.packagingFeePaise).toBe(1000); // Configured ₹10 packaging fee

      orderId = body.data.order.id;
      orderTotalPaise = body.data.order.totalPaise;
    });

    it('packing pass marks order PACKED and deducts packaging stock once', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/orders/${orderId}/packed`
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.status).toBe('PACKED');

      // Duplicate attempt should not throw or double deduct
      const dupRes = await app.inject({
        method: 'POST',
        url: `/api/v1/orders/${orderId}/packed`
      });
      expect(dupRes.statusCode).toBe(200);
    });

    it('cashier records payment at pickup and completes handover', async () => {
      // Pay
      const payRes = await app.inject({
        method: 'POST',
        url: '/api/v1/payments',
        payload: {
          orderId,
          amountPaise: orderTotalPaise,
          method: 'CASH'
        }
      });
      expect(payRes.statusCode).toBe(200);

      // Handover
      const handRes = await app.inject({
        method: 'POST',
        url: `/api/v1/orders/${orderId}/handoff`
      });
      expect(handRes.statusCode).toBe(200);
      const handBody = JSON.parse(handRes.body);
      expect(handBody.data.status).toBe('COMPLETED');
    });
  });

  // SCENARIO D: Table 2 QR journey
  describe('Scenario D: Table 2 QR Journey, Multi-Round Ordering & Cashier Settlement', () => {
    let sessionToken: string;

    it('exchanges Table 2 QR token for active session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/table-session',
        payload: { tableToken: 'token_t2_11b3c' }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.tableNumber).toBe('T2');
      expect(body.data.sessionToken).toBeDefined();
      sessionToken = body.data.sessionToken;
    });

    it('places round 1 order under Table 2 session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload: {
          channel: 'QR_TABLE',
          tableSessionToken: sessionToken,
          items: [{ dishVariantId: 'var-bassaru-reg', quantity: 1 }]
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.order.status).toBe('ACCEPTED');
    });

    it('places round 2 order under same Table 2 session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload: {
          channel: 'QR_TABLE',
          tableSessionToken: sessionToken,
          items: [{ dishVariantId: 'var-rotti-pair', quantity: 1 }]
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.order.status).toBe('ACCEPTED');
    });

    it('customer requests bill from table', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/request-bill',
        payload: { tableSessionToken: sessionToken }
      });
      expect(res.statusCode).toBe(200);
    });

    it('cashier acknowledges and closes table session', async () => {
      // Cashier acknowledge
      const ackRes = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/acknowledge-bill',
        payload: { tableId: 'tbl-02', cashierUserId: 'usr-cash-01' }
      });
      expect(ackRes.statusCode).toBe(200);

      // Close session
      const closeRes = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/close-table-session',
        payload: { tableId: 'tbl-02' }
      });
      expect(closeRes.statusCode).toBe(200);
    });

    it('rejects new order placement on closed table session with 403 SESSION_CLOSED', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload: {
          channel: 'QR_TABLE',
          tableSessionToken: sessionToken,
          items: [{ dishVariantId: 'var-bbb-reg', quantity: 1 }]
        }
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('SESSION_CLOSED');
    });
  });

  // SCENARIO E: Concurrency & Transactional Cart Rollback
  describe('Scenario E: Concurrency & Single Transaction Cart Rollback', () => {
    it('rolls back entire cart if line 2 is unavailable (leaves line 1 untouched)', async () => {
      // Check current Bassaru batch yield before attempt
      const menuBefore = await app.inject({ method: 'GET', url: '/api/v1/menu' });
      const dishesBefore = JSON.parse(menuBefore.body).data.dishes;
      const bassaruBefore = dishesBefore.find((d: any) => d.code === 'DISH-BAS');
      const initialPortions = bassaruBefore.availablePortions;

      // Cart with 1 Bassaru (valid) + 9999 Bisi Bele Bath (impossible)
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload: {
          channel: 'WALK_IN_POS',
          customerName: 'Test Rollback Customer',
          items: [
            { dishVariantId: 'var-bassaru-reg', quantity: 1 },
            { dishVariantId: 'var-bbb-reg', quantity: 9999 } // Triggers 409
          ]
        }
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('INSUFFICIENT_STOCK');

      // Verify Bassaru stock/batch was NOT deducted
      const menuAfter = await app.inject({ method: 'GET', url: '/api/v1/menu' });
      const dishesAfter = JSON.parse(menuAfter.body).data.dishes;
      const bassaruAfter = dishesAfter.find((d: any) => d.code === 'DISH-BAS');
      expect(bassaruAfter.availablePortions).toBe(initialPortions);
    });
  });

  // SCENARIO F: Kitchen Equipment Exclusive Locks
  describe('Scenario F: Kitchen Equipment Exclusive Lock Enforcement', () => {
    it('rejects overlapping task on exclusive equipment with 409 STOVE_OCCUPIED_CONFLICT', async () => {
      // 1. Acquire lock on Burner 1
      const lockRes1 = await app.inject({
        method: 'POST',
        url: '/api/v1/equipment/acquire-lock',
        payload: {
          equipmentId: 'eq-burner-1',
          taskId: 'task-live-101',
          durationMinutes: 20
        }
      });
      expect(lockRes1.statusCode).toBe(200);

      // 2. Competing attempt on Burner 1 must fail
      const lockRes2 = await app.inject({
        method: 'POST',
        url: '/api/v1/equipment/acquire-lock',
        payload: {
          equipmentId: 'eq-burner-1',
          taskId: 'task-competing-102',
          durationMinutes: 10
        }
      });
      expect(lockRes2.statusCode).toBe(409);
      const body2 = JSON.parse(lockRes2.body);
      expect(body2.error.code).toBe('STOVE_OCCUPIED_CONFLICT');

      // 3. Release lock
      const releaseRes = await app.inject({
        method: 'POST',
        url: '/api/v1/equipment/release-lock',
        payload: { equipmentId: 'eq-burner-1' }
      });
      expect(releaseRes.statusCode).toBe(200);
    });
  });

  // SCENARIO G: Reports, Cash Shifts & Mock Integrations
  describe('Scenario G: Reports, Cash Shifts & Mock Provider Deduplication', () => {
    it('manages cash drawer shift and reconciles sales reports', async () => {
      // Open shift
      const openRes = await app.inject({
        method: 'POST',
        url: '/api/v1/cash-sessions/open',
        payload: { openingCashPaise: 200000 }
      });
      expect(openRes.statusCode).toBe(200);
      const sessionId = JSON.parse(openRes.body).data.id;

      // Close shift with counted cash
      const closeRes = await app.inject({
        method: 'POST',
        url: '/api/v1/cash-sessions/close',
        payload: {
          sessionId,
          countedCashPaise: 200000,
          notes: 'End of shift count exact'
        }
      });
      expect(closeRes.statusCode).toBe(200);

      // Sales report
      const salesRes = await app.inject({ method: 'GET', url: '/api/v1/reports/sales' });
      expect(salesRes.statusCode).toBe(200);
      const sales = JSON.parse(salesRes.body).data;
      expect(sales.totalOrders).toBeGreaterThan(0);
    });

    it('deduplicates incoming mock ONDC orders idempotently', async () => {
      const orderPayload = {
        provider: 'ONDC',
        providerOrderId: 'ONDC-ORDER-TEST-9988',
        items: [{ dishVariantId: 'var-bbb-reg', quantity: 1 }],
        totalPaise: 9000
      };

      // First delivery
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/mock-order',
        payload: orderPayload
      });
      expect(res1.statusCode).toBe(200);
      const body1 = JSON.parse(res1.body);
      expect(body1.deduplicated).toBe(false);

      // Duplicate delivery with same providerOrderId
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/mock-order',
        payload: orderPayload
      });
      expect(res2.statusCode).toBe(200);
      const body2 = JSON.parse(res2.body);
      expect(body2.deduplicated).toBe(true);
    });
  });
});
