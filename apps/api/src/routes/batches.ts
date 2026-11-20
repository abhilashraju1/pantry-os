import { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { getDatabase } from '@pantryos/database';

export const batchRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all production batches
  fastify.get('/batches', async () => {
    const db = await getDatabase();
    const result = await db.execute(sql`
      SELECT b.id, b.batch_code as "batchCode", b.dish_id as "dishId",
             b.status, b.planned_yield::float as "plannedYield",
             b.actual_usable_yield::float as "actualUsableYield",
             b.remaining_usable_yield::float as "remainingUsableYield",
             b.yield_unit as "yieldUnit",
             b.assigned_equipment_id as "assignedEquipmentId",
             b.assigned_chef_id as "assignedChefId",
             b.cooked_at as "cookedAt",
             b.expires_at as "expiresAt",
             b.quality_approved_at as "qualityApprovedAt",
             b.quality_core_temperature_c::float as "qualityCoreTemperatureC",
             d.name_en as "dishNameEn", d.name_kn as "dishNameKn"
      FROM production_batches b
      LEFT JOIN dishes d ON b.dish_id = d.id
      ORDER BY b.created_at DESC
    `);

    const batches = (result as any).rows || result;
    return { success: true, data: { batches } };
  });

  // Plan production batch
  fastify.post('/batches/plan', async (request, reply) => {
    const { dishId, plannedYield, recipeVersionId, branchId } = request.body as any;

    if (!dishId || !plannedYield) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'dishId and plannedYield are required' }
      });
    }

    const db = await getDatabase();
    const id = 'batch-' + crypto.randomUUID();
    const bCode = `BATCH-${Date.now().toString().slice(-6)}`;
    const bId = branchId || 'branch-blr-vvp-01';
    const rVersion = recipeVersionId || 'rcp-v-bbb-01';

    await db.execute(sql`
      INSERT INTO production_batches (id, branch_id, batch_code, recipe_version_id, dish_id, status, planned_yield, yield_unit)
      VALUES (${id}, ${bId}, ${bCode}, ${rVersion}, ${dishId}, 'PLANNED', ${plannedYield}, 'g')
    `);

    return {
      success: true,
      data: {
        batch: { id, batchCode: bCode, dishId, status: 'PLANNED', plannedYield }
      }
    };
  });

  // Start batch cooking
  fastify.post('/batches/:id/start', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = await getDatabase();

    await db.execute(sql`
      UPDATE production_batches
      SET status = 'COOKING'
      WHERE id = ${id}
    `);

    return { success: true, data: { id, status: 'COOKING' } };
  });

  // Quality check & release batch to READY
  fastify.post('/batches/:id/quality-signoff', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { actualUsableYield, coreTemperatureC, sensoryCheckPassed, chefUserId } = request.body as {
      actualUsableYield: number;
      coreTemperatureC: number;
      sensoryCheckPassed?: boolean;
      chefUserId?: string;
    };

    if (actualUsableYield === undefined || coreTemperatureC === undefined) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'actualUsableYield and coreTemperatureC are required' }
      });
    }

    const db = await getDatabase();
    const batchRes = await db.execute(sql`
      SELECT id, status, remaining_usable_yield, quality_approved_at
      FROM production_batches
      WHERE id = ${id}
      LIMIT 1
    `);
    const batch = ((batchRes as any).rows || batchRes)?.[0];

    if (!batch) {
      return reply.status(404).send({
        success: false,
        error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' }
      });
    }

    // Protect existing allocations if already approved
    if (batch.quality_approved_at && batch.status === 'READY') {
      return reply.status(409).send({
        success: false,
        error: { code: 'ALREADY_APPROVED', message: 'Batch already quality-approved and released' }
      });
    }

    // FSSAI Core temperature check: must be >= 60°C
    if (coreTemperatureC < 60.0 || sensoryCheckPassed === false) {
      await db.execute(sql`
        UPDATE production_batches
        SET status = 'CANCELLED',
            quality_core_temperature_c = ${coreTemperatureC}
        WHERE id = ${id}
      `);

      return reply.status(400).send({
        success: false,
        error: {
          code: 'QUALITY_CHECK_FAILED',
          message: `Food safety check failed: Core temperature ${coreTemperatureC}°C is below mandatory 60°C threshold.`
        }
      });
    }

    // Quality check PASSED: Release batch to READY
    const expiresAt = new Date(Date.now() + 4 * 3600 * 1000); // 4-hour holding window
    await db.execute(sql`
      UPDATE production_batches
      SET status = 'READY',
          actual_usable_yield = ${actualUsableYield},
          remaining_usable_yield = ${actualUsableYield},
          quality_core_temperature_c = ${coreTemperatureC},
          quality_approved_at = NOW(),
          quality_approved_by = ${chefUserId || 'usr-chef-01'},
          cooked_at = NOW(),
          expires_at = ${expiresAt.toISOString()}
      WHERE id = ${id}
    `);

    return {
      success: true,
      data: {
        batch: {
          id,
          status: 'READY',
          actualUsableYield,
          remainingUsableYield: actualUsableYield,
          coreTemperatureC,
          qualityApprovedAt: new Date().toISOString()
        }
      }
    };
  });
};
