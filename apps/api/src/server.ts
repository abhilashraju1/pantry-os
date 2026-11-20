import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import { sql } from 'drizzle-orm';
import { authRoutes } from './routes/auth.js';
import { inventoryRoutes } from './routes/inventory.js';
import { recipeRoutes } from './routes/recipes.js';
import { batchRoutes } from './routes/batches.js';
import { kitchenRoutes } from './routes/kitchen.js';
import { orderRoutes } from './routes/orders.js';
import { paymentRoutes } from './routes/payments.js';
import { reportRoutes } from './routes/reports.js';
import { integrationRoutes } from './routes/integrations.js';
import { wsHub } from './ws/hub.js';
import { initApiDatabase, getDatabase } from './db.js';

export async function createServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false
  });

  // Initialize and migrate database
  await initApiDatabase();

  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(cookie);
  await app.register(websocket);

  // Health check
  app.get('/health', async () => {
    const db = await getDatabase();
    const branchRes = await db.execute(sql`SELECT code, name FROM branches LIMIT 1`);
    const branch = ((branchRes as any).rows || branchRes)?.[0];

    return {
      status: 'healthy',
      version: '1.0.0',
      branch: branch?.code || 'BLR-VVP-01',
      branchName: branch?.name || 'VV Puram Food Street Branch',
      timestamp: new Date().toISOString()
    };
  });

  // WebSocket endpoint
  app.register(async function (fastify) {
    fastify.get('/api/v1/ws', { websocket: true }, (socket, req) => {
      const branchId = 'branch-blr-vvp-01';
      wsHub.register(socket, branchId);
      socket.send(
        JSON.stringify({
          type: 'CONNECTED',
          branchId,
          timestamp: new Date().toISOString()
        })
      );
    });
  });

  // REST API Domain Routes
  app.register(authRoutes, { prefix: '/api/v1' });
  app.register(inventoryRoutes, { prefix: '/api/v1' });
  app.register(recipeRoutes, { prefix: '/api/v1' });
  app.register(batchRoutes, { prefix: '/api/v1' });
  app.register(kitchenRoutes, { prefix: '/api/v1' });
  app.register(orderRoutes, { prefix: '/api/v1' });
  app.register(paymentRoutes, { prefix: '/api/v1' });
  app.register(reportRoutes, { prefix: '/api/v1' });
  app.register(integrationRoutes, { prefix: '/api/v1' });

  return app;
}
