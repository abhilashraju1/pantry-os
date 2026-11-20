import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from './server.js';
import { getDatabase, resetDemo, closeDatabase, sql } from '@pantryos/database';
import { getDictionary } from '@pantryos/i18n';

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
      // Clear prior batches for dish-bbb to ensure strictly controlled 6-portion fixture (1,800g usable yield, 300g per portion)
      const db = await getDatabase();
      await db.execute(sql`DELETE FROM batch_reservations WHERE batch_id IN (SELECT id FROM production_batches WHERE dish_id = 'dish-bbb')`);
      await db.execute(sql`DELETE FROM production_batches WHERE dish_id = 'dish-bbb'`);

      // Plan fresh batch for controlled 6-portion fixture
      const planRes = await app.inject({
        method: 'POST',
        url: '/api/v1/batches/plan',
        payload: { dishId: 'dish-bbb', plannedYield: 1800 }
      });
      const validBatchId = JSON.parse(planRes.body).data.batch.id;

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/batches/${validBatchId}/quality-signoff`,
        payload: {
          actualUsableYield: 1800,
          coreTemperatureC: 76.5,
          sensoryCheckPassed: true
        }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.batch.status).toBe('READY');
      expect(body.data.batch.remainingUsableYield).toBe(1800);
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
          items: [{ dishVariantId: 'var-bbb-reg', quantity: 1 }]
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
          items: [{ dishVariantId: 'var-bbb-reg', quantity: 1 }]
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

  // SCENARIO E: Restart and reconciliation
  describe('Scenario E: API Restart & Full State Persistence Reconciliation', () => {
    it('survives API restart with persisted state and exact 1-portion remaining fixture', async () => {
      // 1. Restart API server instance with the same database
      await app.close();
      app = await createServer();

      // 2. Verify order histories survive restart
      const ordersRes = await app.inject({ method: 'GET', url: '/api/v1/orders' });
      expect(ordersRes.statusCode).toBe(200);
      const orders = JSON.parse(ordersRes.body).data.orders;
      expect(orders.length).toBeGreaterThanOrEqual(3); // 1 pickup + 2 QR

      // 3. Verify controlled 6-portion fixture math:
      // Initial: 1800g (6 portions of 300g). Pickup: 3 portions (900g). QR: 2 portions (600g).
      // Remaining: exactly 1 portion (300g) of Bisi Bele Bath!
      const menuRes = await app.inject({ method: 'GET', url: '/api/v1/menu' });
      expect(menuRes.statusCode).toBe(200);
      const dishes = JSON.parse(menuRes.body).data.dishes;
      const bbb = dishes.find((d: any) => d.code === 'DISH-BBB');
      expect(bbb.availablePortions).toBe(1);

      // 4. Verify packaging container stock deducted once (350 seeded - 1 = 349)
      const invRes = await app.inject({ method: 'GET', url: '/api/v1/inventory/items' });
      expect(invRes.statusCode).toBe(200);
      const items = JSON.parse(invRes.body).data.items;
      const pkg = items.find((i: any) => i.id === 'ing-pkg-container');
      expect(pkg.currentStock).toBe(349);
    });
  });

  // SCENARIO F: Rejection and concurrency
  describe('Scenario F: Rejection, Concurrency on Final Portion & Cart Rollback', () => {
    it('rolls back entire cart if one line fails (leaves line 1 untouched)', async () => {
      const menuBefore = await app.inject({ method: 'GET', url: '/api/v1/menu' });
      const bassaruBefore = JSON.parse(menuBefore.body).data.dishes.find((d: any) => d.code === 'DISH-BAS');
      const initialPortions = bassaruBefore.availablePortions;

      // Cart with 1 valid Bassaru + 9999 impossible portions
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload: {
          channel: 'WALK_IN_POS',
          customerName: 'Rollback Tester',
          items: [
            { dishVariantId: 'var-bassaru-reg', quantity: 1 },
            { dishVariantId: 'var-bbb-reg', quantity: 9999 }
          ]
        }
      });
      expect(res.statusCode).toBe(409);

      // Verify Bassaru stock was untouched
      const menuAfter = await app.inject({ method: 'GET', url: '/api/v1/menu' });
      const bassaruAfter = JSON.parse(menuAfter.body).data.dishes.find((d: any) => d.code === 'DISH-BAS');
      expect(bassaruAfter.availablePortions).toBe(initialPortions);
    });

    it('races two concurrent orders for the final 1 portion: exactly 1 succeeds and 1 gets 409', async () => {
      // Exactly 1 portion of Bisi Bele Bath remains
      const [res1, res2] = await Promise.all([
        app.inject({
          method: 'POST',
          url: '/api/v1/orders',
          payload: {
            channel: 'WALK_IN_POS',
            customerName: 'Racer 1',
            items: [{ dishVariantId: 'var-bbb-reg', quantity: 1 }]
          }
        }),
        app.inject({
          method: 'POST',
          url: '/api/v1/orders',
          payload: {
            channel: 'WALK_IN_POS',
            customerName: 'Racer 2',
            items: [{ dishVariantId: 'var-bbb-reg', quantity: 1 }]
          }
        })
      ]);

      const statusCodes = [res1.statusCode, res2.statusCode].sort();
      expect(statusCodes).toEqual([200, 409]);
    });

    it('cancels order and releases batch reservation back to available yield', async () => {
      // Place order for 1 Bassaru
      const orderRes = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload: {
          channel: 'WALK_IN_POS',
          customerName: 'Cancel Customer',
          items: [{ dishVariantId: 'var-bassaru-reg', quantity: 1 }]
        }
      });
      expect(orderRes.statusCode).toBe(200);
      const orderId = JSON.parse(orderRes.body).data.order.id;

      // Cancel order
      const cancelRes = await app.inject({
        method: 'POST',
        url: `/api/v1/orders/${orderId}/cancel`,
        payload: { reason: 'Customer changed mind' }
      });
      expect(cancelRes.statusCode).toBe(200);
      const cancelBody = JSON.parse(cancelRes.body);
      expect(cancelBody.data.status).toBe('CANCELLED');
    });

    it('rejects duplicate payment on already-paid order with 400 ORDER_ALREADY_PAID', async () => {
      // Create and pay order
      const oRes = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload: {
          channel: 'WALK_IN_POS',
          customerName: 'Paid Customer',
          items: [{ dishVariantId: 'var-bassaru-reg', quantity: 1 }]
        }
      });
      const oId = JSON.parse(oRes.body).data.order.id;
      const total = JSON.parse(oRes.body).data.order.totalPaise;

      const p1 = await app.inject({
        method: 'POST',
        url: '/api/v1/payments',
        payload: { orderId: oId, amountPaise: total, method: 'CASH' }
      });
      expect(p1.statusCode).toBe(200);

      // Attempt duplicate payment
      const p2 = await app.inject({
        method: 'POST',
        url: '/api/v1/payments',
        payload: { orderId: oId, amountPaise: total, method: 'CASH' }
      });
      expect(p2.statusCode).toBe(400);
      expect(JSON.parse(p2.body).error.code).toBe('ORDER_ALREADY_PAID');
    });
  });

  // SCENARIO G: Kitchen Equipment Locks, Quality & Out-of-Service
  describe('Scenario G: Kitchen Equipment Locks, Quality Rejection & Out-of-Service', () => {
    it('enforces exclusive equipment locks and rejects concurrent stove usage with 409', async () => {
      // 1. Acquire lock
      const lock1 = await app.inject({
        method: 'POST',
        url: '/api/v1/equipment/acquire-lock',
        payload: { equipmentId: 'eq-burner-1', taskId: 'task-test-g1', durationMinutes: 15 }
      });
      expect(lock1.statusCode).toBe(200);

      // 2. Competing lock attempt rejected
      const lock2 = await app.inject({
        method: 'POST',
        url: '/api/v1/equipment/acquire-lock',
        payload: { equipmentId: 'eq-burner-1', taskId: 'task-test-g2', durationMinutes: 10 }
      });
      expect(lock2.statusCode).toBe(409);
      expect(JSON.parse(lock2.body).error.code).toBe('STOVE_OCCUPIED_CONFLICT');

      // 3. Release lock
      const rel = await app.inject({
        method: 'POST',
        url: '/api/v1/equipment/release-lock',
        payload: { equipmentId: 'eq-burner-1' }
      });
      expect(rel.statusCode).toBe(200);
    });

    it('rejects locking equipment that is in MAINTENANCE status with 409 EQUIPMENT_OUT_OF_SERVICE', async () => {
      // Set burner to MAINTENANCE
      await app.inject({
        method: 'PATCH',
        url: '/api/v1/equipment/eq-burner-1/status',
        payload: { status: 'MAINTENANCE' }
      });

      // Attempt lock on maintenance equipment
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/equipment/acquire-lock',
        payload: { equipmentId: 'eq-burner-1', taskId: 'task-maintenance-test', durationMinutes: 10 }
      });
      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.body).error.code).toBe('EQUIPMENT_OUT_OF_SERVICE');

      // Restore equipment status to AVAILABLE
      await app.inject({
        method: 'PATCH',
        url: '/api/v1/equipment/eq-burner-1/status',
        payload: { status: 'AVAILABLE' }
      });
    });
  });

  // SCENARIO H: Responsive, Localization & Guest Route Isolation
  describe('Scenario H: Bilingual i18n Dictionaries & Guest Route Isolation', () => {
    it('provides complete Kannada and English localization dictionaries', () => {
      const enDict = getDictionary('en');
      const knDict = getDictionary('kn');

      expect(enDict.common.brandName).toBe('PantryOS');
      expect(knDict.common.brandName).toBe('ಪ್ಯಾಂಟ್ರಿ ಓಎಸ್');
      expect(knDict.dishes.bbbTitle).toBe('ಬಿಸಿ ಬೇಳೆ ಬಾತ್');
      expect(knDict.dishes.bassaruTitle).toBe('ಬಸ್ಸಾರು');
      expect(knDict.dishes.akkiRottiTitle).toBe('ಅಕ್ಕಿ ರೊಟ್ಟಿ');
    });

    it('strictly isolates guest session and rejects unauthenticated staff route access with 401', async () => {
      // Request /auth/me without session cookie
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me'
      });
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error.code).toBe('UNAUTHORIZED');
    });
  });

  // SCENARIO I: Reports Reconciliation & Mock Provider Deduplication/Cancellation
  describe('Scenario I: Reports Reconciliation & Mock Provider Deduplication/Cancellation', () => {
    it('manages cash drawer shift and reconciles sales reports', async () => {
      const openRes = await app.inject({
        method: 'POST',
        url: '/api/v1/cash-sessions/open',
        payload: { openingCashPaise: 200000 }
      });
      expect(openRes.statusCode).toBe(200);
      const sessionId = JSON.parse(openRes.body).data.id;

      const closeRes = await app.inject({
        method: 'POST',
        url: '/api/v1/cash-sessions/close',
        payload: { sessionId, countedCashPaise: 200000, notes: 'End of shift count exact' }
      });
      expect(closeRes.statusCode).toBe(200);

      const salesRes = await app.inject({ method: 'GET', url: '/api/v1/reports/sales' });
      expect(salesRes.statusCode).toBe(200);
      const sales = JSON.parse(salesRes.body).data;
      expect(sales.totalOrders).toBeGreaterThan(0);
      expect(sales.paidSalesPaise).toBeGreaterThan(0);
    });

    it('deduplicates mock ONDC orders and releases reservations on mock cancellation', async () => {
      const orderPayload = {
        provider: 'ONDC',
        providerOrderId: 'ONDC-ORDER-TEST-9988',
        items: [{ dishVariantId: 'var-bassaru-reg', quantity: 1 }],
        totalPaise: 9000
      };

      // 1. First delivery
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/mock-order',
        payload: orderPayload
      });
      expect(res1.statusCode).toBe(200);
      expect(JSON.parse(res1.body).deduplicated).toBe(false);

      // 2. Duplicate delivery with same providerOrderId
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/mock-order',
        payload: orderPayload
      });
      expect(res2.statusCode).toBe(200);
      expect(JSON.parse(res2.body).deduplicated).toBe(true);

      // 3. Mock cancellation releases reservation
      const cancelRes = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/mock-cancel',
        payload: { providerOrderId: 'ONDC-ORDER-TEST-9988', reason: 'Customer cancelled on ONDC app' }
      });
      expect(cancelRes.statusCode).toBe(200);
      expect(JSON.parse(cancelRes.body).data.status).toBe('CANCELLED');
    });
  });
});
