import { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { getDatabase } from '@pantryos/database';

export const kitchenRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all kitchen equipment
  fastify.get('/equipment', async () => {
    const db = await getDatabase();
    const result = await db.execute(sql`
      SELECT id, code, name_en as "nameEn", name_kn as "nameKn",
             station_id as "stationId", type, status,
             is_exclusive as "isExclusive",
             current_task_id as "currentTaskId",
             locked_until as "lockedUntil"
      FROM kitchen_equipment
      ORDER BY code ASC
    `);

    const equipment = (result as any).rows || result;
    return { success: true, data: { equipment } };
  });

  // Acquire exclusive lock on stove / tawa
  fastify.post('/equipment/acquire-lock', async (request, reply) => {
    const { equipmentId, taskId, durationMinutes } = request.body as {
      equipmentId: string;
      taskId: string;
      durationMinutes: number;
    };

    if (!equipmentId || !taskId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'equipmentId and taskId are required' }
      });
    }

    const db = await getDatabase();
    const eqRes = await db.execute(sql`
      SELECT id, code, name_en, type, status, is_exclusive, current_task_id, locked_until
      FROM kitchen_equipment
      WHERE id = ${equipmentId}
      LIMIT 1
    `);
    const eq = ((eqRes as any).rows || eqRes)?.[0];

    if (!eq) {
      return reply.status(404).send({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'Equipment not found' }
      });
    }

    if (eq.status === 'MAINTENANCE' || eq.status === 'OFFLINE') {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'EQUIPMENT_OUT_OF_SERVICE',
          message: `Equipment ${eq.code} (${eq.name_en}) is currently ${eq.status} and cannot be locked.`
        }
      });
    }

    const now = new Date();
    const isCurrentlyLocked = eq.locked_until && new Date(eq.locked_until) > now && eq.current_task_id !== taskId;

    if (eq.is_exclusive && isCurrentlyLocked) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'STOVE_OCCUPIED_CONFLICT',
          message: `Equipment ${eq.code} (${eq.name_en}) is currently occupied by active task ${eq.current_task_id} until ${eq.locked_until}.`
        }
      });
    }

    const lockDuration = durationMinutes || 15;
    const lockedUntil = new Date(now.getTime() + lockDuration * 60 * 1000);

    await db.execute(sql`
      UPDATE kitchen_equipment
      SET current_task_id = ${taskId},
          locked_until = ${lockedUntil.toISOString()},
          status = 'OCCUPIED'
      WHERE id = ${equipmentId}
    `);

    return {
      success: true,
      data: {
        equipmentId,
        taskId,
        lockedUntil: lockedUntil.toISOString()
      }
    };
  });

  // Release equipment lock
  fastify.post('/equipment/release-lock', async (request, reply) => {
    const { equipmentId } = request.body as { equipmentId: string };
    const db = await getDatabase();

    await db.execute(sql`
      UPDATE kitchen_equipment
      SET current_task_id = NULL,
          locked_until = NULL,
          status = 'AVAILABLE'
      WHERE id = ${equipmentId}
    `);

    return { success: true, message: 'Equipment lock released' };
  });

  // Get active cooking tasks
  fastify.get('/kitchen/tasks', async () => {
    const db = await getDatabase();
    const result = await db.execute(sql`
      SELECT t.id, t.dish_id as "dishId", t.equipment_id as "equipmentId",
             t.batch_id as "batchId", t.order_item_id as "orderItemId",
             t.status, t.current_step_order as "currentStepOrder",
             t.current_step_started_at as "currentStepStartedAt",
             t.locked_until as "lockedUntil",
             d.name_en as "dishNameEn", d.name_kn as "dishNameKn",
             e.code as "equipmentCode"
      FROM cooking_tasks t
      LEFT JOIN dishes d ON t.dish_id = d.id
      LEFT JOIN kitchen_equipment e ON t.equipment_id = e.id
      WHERE t.status != 'COMPLETED' AND t.status != 'CANCELLED'
      ORDER BY t.created_at ASC
    `);

    const tasks = (result as any).rows || result;
    return { success: true, data: { tasks } };
  });

  // Advance cooking task step
  fastify.post('/kitchen/tasks/:id/step', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { nextStepOrder, isCompleted } = request.body as { nextStepOrder: number; isCompleted?: boolean };

    const db = await getDatabase();
    if (isCompleted) {
      await db.execute(sql`
        UPDATE cooking_tasks
        SET status = 'COMPLETED',
            completed_at = NOW()
        WHERE id = ${id}
      `);
      return { success: true, data: { id, status: 'COMPLETED' } };
    }

    await db.execute(sql`
      UPDATE cooking_tasks
      SET current_step_order = ${nextStepOrder},
          current_step_started_at = NOW(),
          status = 'IN_PROGRESS'
      WHERE id = ${id}
    `);

    return { success: true, data: { id, currentStepOrder: nextStepOrder, status: 'IN_PROGRESS' } };
  });

  // Admin/Chef: update equipment status (e.g. MAINTENANCE, AVAILABLE, OFFLINE)
  fastify.patch('/equipment/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const db = await getDatabase();
    await db.execute(sql`
      UPDATE kitchen_equipment
      SET status = ${status}
      WHERE id = ${id}
    `);

    return { success: true, data: { id, status } };
  });
};
