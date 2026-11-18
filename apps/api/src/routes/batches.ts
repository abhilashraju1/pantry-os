import { FastifyPluginAsync } from 'fastify';
import { store } from '../store/memory-store.js';
import { canTransitionBatch, calculateMaxPortions } from '@pantryos/business-rules';
import { wsHub } from '../ws/hub.js';

export const batchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/batches', async () => {
    const batches = store.batches.map((batch) => {
      const dish = store.dishes.find((d) => d.id === batch.dishId);
      const portionSize = dish?.variants[0]?.portionQuantity || 1;
      const portionsRemaining = batch.remainingUsableYield
        ? calculateMaxPortions(batch.remainingUsableYield, portionSize)
        : 0;

      return {
        ...batch,
        dishNameEn: dish?.nameEn,
        dishNameKn: dish?.nameKn,
        portionsRemaining
      };
    });

    return {
      success: true,
      data: { batches }
    };
  });

  fastify.post('/batches/plan', async (request, reply) => {
    const { dishId, plannedYield, assignedEquipmentId } = request.body as {
      dishId: string;
      plannedYield: number;
      assignedEquipmentId?: string;
    };

    const dish = store.dishes.find((d) => d.id === dishId);
    if (!dish) {
      return reply.status(404).send({
        success: false,
        error: { code: 'DISH_NOT_FOUND', message: 'Dish does not exist' }
      });
    }

    const newBatch = {
      id: `batch-${Date.now()}`,
      batchCode: `BATCH-${dish.code.replace('DISH-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      branchId: store.branch.id,
      recipeVersionId: dish.activeVersionId,
      dishId,
      status: 'PLANNED' as const,
      plannedYield,
      actualUsableYield: null,
      remainingUsableYield: null,
      yieldUnit: dish.variants[0].portionUnit,
      assignedEquipmentId: assignedEquipmentId || null,
      assignedChefId: 'usr-chef-01',
      currentStepId: null,
      stepStartedAt: null,
      cookedAt: null,
      expiresAt: null,
      qualityApprovedAt: null,
      qualityApprovedBy: null,
      qualityCoreTemperatureC: null,
      createdAt: new Date().toISOString()
    };

    store.batches.push(newBatch);

    wsHub.broadcast({
      type: 'BATCH_UPDATED',
      branchId: store.branch.id,
      timestamp: new Date().toISOString(),
      payload: { batch: newBatch }
    });

    return {
      success: true,
      data: { batch: newBatch }
    };
  });

  fastify.post('/batches/:id/quality-signoff', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { actualUsableYield, coreTemperatureC, sensoryCheckPassed } = request.body as {
      actualUsableYield: number;
      coreTemperatureC: number;
      sensoryCheckPassed: boolean;
    };

    const batch = store.batches.find((b) => b.id === id);
    if (!batch) {
      return reply.status(404).send({
        success: false,
        error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' }
      });
    }

    if (coreTemperatureC < 60) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'FOOD_SAFETY_VIOLATION',
          message: 'FSSAI Rule: Core temperature must be >= 60°C for hot holding release.'
        }
      });
    }

    batch.actualUsableYield = actualUsableYield;
    batch.remainingUsableYield = actualUsableYield;
    batch.qualityCoreTemperatureC = coreTemperatureC;
    batch.qualityApprovedAt = new Date().toISOString();
    batch.qualityApprovedBy = 'usr-chef-01';
    batch.status = 'READY';
    batch.cookedAt = new Date().toISOString();
    batch.expiresAt = new Date(Date.now() + 4 * 3600 * 1000).toISOString(); // 4 hours holding

    wsHub.broadcast({
      type: 'BATCH_UPDATED',
      branchId: store.branch.id,
      timestamp: new Date().toISOString(),
      payload: { batch }
    });

    return {
      success: true,
      data: { batch }
    };
  });
};
