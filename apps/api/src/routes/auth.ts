import { FastifyPluginAsync } from 'fastify';
import { store } from '../store/memory-store.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password?: string };
    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'User with this email not found' }
      });
    }

    reply.setCookie('pantry_session', `sess_${user.id}`, {
      path: '/',
      httpOnly: true,
      secure: false, // Local development
      sameSite: 'lax'
    });

    return {
      success: true,
      data: { user }
    };
  });

  fastify.get('/auth/me', async (request, reply) => {
    // Default to manager for dev demo inspection
    const user = store.users[0];
    return {
      success: true,
      data: { user, branch: store.branch }
    };
  });

  fastify.post('/auth/table-session', async (request, reply) => {
    const { tableToken } = request.body as { tableToken: string };
    const table = store.tables.find((t) => t.qrToken === tableToken);

    if (!table) {
      return reply.status(404).send({
        success: false,
        error: { code: 'INVALID_TABLE_TOKEN', message: 'Table QR code is invalid or unrecognized' }
      });
    }

    return {
      success: true,
      data: {
        tableId: table.id,
        tableNumber: table.tableNumber,
        sessionToken: `sess_${table.qrToken}`,
        branchId: store.branch.id,
        activeOrderId: null
      }
    };
  });
};
