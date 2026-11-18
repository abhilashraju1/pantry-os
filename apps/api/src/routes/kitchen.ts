import { FastifyPluginAsync } from 'fastify';
import { store } from '../store/memory-store.js';
import { validateEquipmentLock } from '@pantryos/business-rules';
import { wsHub } from '../ws/hub.js';

export const kitchenRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/equipment', async () => {
    return {
      success: true,
      data: { equipment: store.equipment }
    };
  });

  fastify.post('/equipment/acquire-lock', async (request, reply) => {
    const { equipmentId, taskId, durationMinutes } = request.body as {
      equipmentId: string;
      taskId: string;
      durationMinutes: number;
    };

    const eq = store.equipment.find((e) => e.id === equipmentId);
    if (!eq) {
      return reply.status(404).send({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'Kitchen equipment not found' }
      });
    }

    const activeLocks = store.equipment
      .filter((e) => e.currentTaskId && e.lockedUntil)
      .map((e) => ({
        taskId: e.currentTaskId!,
        equipmentId: e.id,
        startedAt: new Date(),
        lockedUntil: new Date(e.lockedUntil!)
      }));

    const check = validateEquipmentLock(equipmentId, activeLocks);
    if (!check.canAcquire) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'STOVE_OCCUPIED_CONFLICT',
          message: `${eq.nameEn} is currently occupied by another active task until ${eq.lockedUntil}`
        }
      });
    }

    const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    eq.status = 'OCCUPIED';
    eq.currentTaskId = taskId;
    eq.lockedUntil = lockedUntil;

    wsHub.broadcast({
      type: 'EQUIPMENT_LOCK_CHANGED',
      branchId: store.branch.id,
      timestamp: new Date().toISOString(),
      payload: { equipment: eq }
    });

    return {
      success: true,
      data: { equipment: eq }
    };
  });

  fastify.post('/equipment/release-lock', async (request, reply) => {
    const { equipmentId } = request.body as { equipmentId: string };
    const eq = store.equipment.find((e) => e.id === equipmentId);
    if (!eq) {
      return reply.status(404).send({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'Kitchen equipment not found' }
      });
    }

    eq.status = 'AVAILABLE';
    eq.currentTaskId = null;
    eq.lockedUntil = null;

    wsHub.broadcast({
      type: 'EQUIPMENT_LOCK_CHANGED',
      branchId: store.branch.id,
      timestamp: new Date().toISOString(),
      payload: { equipment: eq }
    });

    return {
      success: true,
      data: { equipment: eq }
    };
  });
};
