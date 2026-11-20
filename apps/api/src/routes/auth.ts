import { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { getDatabase, verifyPassword, hashPassword } from '@pantryos/database';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Staff Login
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password?: string };
    if (!email || !password) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Email and password are required' }
      });
    }

    const db = await getDatabase();
    const result = await db.execute(sql`
      SELECT id, organization_id, branch_id, email, password_hash, full_name, phone, roles, is_active
      FROM users
      WHERE LOWER(email) = LOWER(${email}) AND is_active = true
      LIMIT 1
    `);

    const rows = (result as any).rows || result;
    const user = rows?.[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Generate session token
    const token = 'stfsess_' + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 12 * 3600 * 1000);

    await db.execute(sql`
      INSERT INTO staff_sessions (id, token, user_id, branch_id, expires_at)
      VALUES (${'sess-' + crypto.randomUUID()}, ${token}, ${user.id}, ${user.branch_id}, ${expiresAt.toISOString()})
    `);

    reply.setCookie('pantry_session', token, {
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 12 * 3600
    });

    const userProfile = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      roles: user.roles,
      branchId: user.branch_id,
      organizationId: user.organization_id,
      isActive: user.is_active
    };

    return {
      success: true,
      data: { user: userProfile, sessionToken: token }
    };
  });

  // Current session info
  fastify.get('/auth/me', async (request, reply) => {
    const token =
      request.cookies.pantry_session ||
      request.headers.authorization?.replace('Bearer ', '');

    const db = await getDatabase();

    if (!token) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
      });
    }

    const sessionRes = await db.execute(sql`
      SELECT s.token, s.expires_at, s.revoked_at,
             u.id, u.organization_id, u.branch_id, u.email, u.full_name, u.phone, u.roles, u.is_active,
             b.code as branch_code, b.name as branch_name
      FROM staff_sessions s
      JOIN users u ON s.user_id = u.id
      JOIN branches b ON s.branch_id = b.id
      WHERE s.token = ${token} AND s.revoked_at IS NULL AND s.expires_at > NOW()
      LIMIT 1
    `);

    const sRows = (sessionRes as any).rows || sessionRes;
    const session = sRows?.[0];

    if (!session || !session.is_active) {
      return reply.status(401).send({
        success: false,
        error: { code: 'SESSION_EXPIRED', message: 'Session expired or invalid' }
      });
    }

    return {
      success: true,
      data: {
        user: {
          id: session.id,
          email: session.email,
          fullName: session.full_name,
          phone: session.phone,
          roles: session.roles,
          branchId: session.branch_id,
          organizationId: session.organization_id,
          isActive: session.is_active
        },
        branch: {
          id: session.branch_id,
          code: session.branch_code,
          name: session.branch_name
        }
      }
    };
  });

  // Logout
  fastify.post('/auth/logout', async (request, reply) => {
    const token =
      request.cookies.pantry_session ||
      request.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const db = await getDatabase();
      await db.execute(sql`
        UPDATE staff_sessions
        SET revoked_at = NOW()
        WHERE token = ${token}
      `);
    }

    reply.clearCookie('pantry_session', { path: '/' });
    return { success: true, message: 'Logged out successfully' };
  });

  // Table QR Session Exchange
  fastify.post('/auth/table-session', async (request, reply) => {
    const { tableToken } = request.body as { tableToken: string };
    if (!tableToken) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_TABLE_TOKEN', message: 'Table token required' }
      });
    }

    const db = await getDatabase();
    const tableRes = await db.execute(sql`
      SELECT id, branch_id, table_number, qr_token, seating_capacity, status
      FROM dining_tables
      WHERE qr_token = ${tableToken}
      LIMIT 1
    `);

    const tRows = (tableRes as any).rows || tableRes;
    const table = tRows?.[0];

    if (!table) {
      return reply.status(404).send({
        success: false,
        error: { code: 'INVALID_TABLE_TOKEN', message: 'Table QR code is invalid or unrecognized' }
      });
    }

    // Check for existing ACTIVE or BILL_REQUESTED session for this table
    const activeSessRes = await db.execute(sql`
      SELECT id, session_token, status
      FROM table_sessions
      WHERE table_id = ${table.id} AND status != 'CLOSED'
      ORDER BY opened_at DESC
      LIMIT 1
    `);
    const sRows = (activeSessRes as any).rows || activeSessRes;
    let sessionToken = sRows?.[0]?.session_token;

    if (!sessionToken) {
      sessionToken = 'tblsess_' + crypto.randomUUID();
      await db.execute(sql`
        INSERT INTO table_sessions (id, branch_id, table_id, session_token, status)
        VALUES (${'tsess-' + crypto.randomUUID()}, ${table.branch_id}, ${table.id}, ${sessionToken}, 'ACTIVE')
      `);
    }

    return {
      success: true,
      data: {
        tableId: table.id,
        tableNumber: table.table_number,
        sessionToken,
        branchId: table.branch_id,
        seatingCapacity: table.seating_capacity,
        activeOrderId: null
      }
    };
  });

  // Admin: List Staff Users
  fastify.get('/admin/users', async (request, reply) => {
    const db = await getDatabase();
    const result = await db.execute(sql`
      SELECT id, email, full_name, phone, roles, is_active, created_at
      FROM users
      ORDER BY created_at ASC
    `);
    const users = (result as any).rows || result;
    return { success: true, data: { users } };
  });

  // Admin: Create Staff User
  fastify.post('/admin/users', async (request, reply) => {
    const { email, password, fullName, phone, roles, branchId } = request.body as any;
    if (!email || !password || !fullName || !roles) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'email, password, fullName and roles are required' }
      });
    }

    const db = await getDatabase();
    const pHash = hashPassword(password);
    const userId = 'usr-' + crypto.randomUUID();
    const bId = branchId || 'branch-blr-vvp-01';
    const orgId = 'org-01';
    const rolesArrayStr = `{${roles.join(',')}}`;

    await db.execute(sql`
      INSERT INTO users (id, organization_id, branch_id, email, password_hash, full_name, phone, roles, is_active)
      VALUES (${userId}, ${orgId}, ${bId}, ${email}, ${pHash}, ${fullName}, ${phone || null}, ${rolesArrayStr}::text[], true)
    `);

    return {
      success: true,
      data: {
        user: { id: userId, email, fullName, roles, branchId: bId, isActive: true }
      }
    };
  });
};
