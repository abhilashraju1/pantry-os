import { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { getDatabase } from '@pantryos/database';
import { calculateMaxPortions } from '@pantryos/business-rules';

export const recipeRoutes: FastifyPluginAsync = async (fastify) => {
  // Public Menu with dynamic real-time availability
  fastify.get('/menu', async () => {
    const db = await getDatabase();

    const dishesRes = await db.execute(sql`
      SELECT id, code, name_en as "nameEn", name_kn as "nameKn",
             description_en as "descriptionEn", description_kn as "descriptionKn",
             preparation_policy as "preparationPolicy", image_url as "imageUrl",
             recipe_id as "recipeId", active_version_id as "activeVersionId",
             is_active as "isActive"
      FROM dishes
      WHERE is_active = true
      ORDER BY code ASC
    `);
    const dishRows = (dishesRes as any).rows || dishesRes;

    const variantsRes = await db.execute(sql`
      SELECT id, dish_id as "dishId", name_en as "nameEn", name_kn as "nameKn",
             portion_quantity::float as "portionQuantity", portion_unit as "portionUnit",
             price_paise as "pricePaise", packaging_item_id as "packagingItemId"
      FROM dish_variants
    `);
    const variantRows = (variantsRes as any).rows || variantsRes;

    // Active unexpired batches
    const batchesRes = await db.execute(sql`
      SELECT id, dish_id as "dishId", status,
             remaining_usable_yield::float as "remainingUsableYield",
             quality_core_temperature_c::float as "qualityCoreTempC",
             expires_at as "expiresAt"
      FROM production_batches
      WHERE (status = 'READY' OR status = 'HOLDING')
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (quality_core_temperature_c IS NULL OR quality_core_temperature_c >= 60.0)
    `);
    const batchRows = (batchesRes as any).rows || batchesRes;

    // Flour stock for fresh Akki Rotti
    const flourRes = await db.execute(sql`
      SELECT current_stock::float as "currentStock"
      FROM ingredients
      WHERE id = 'ing-rice-flour' OR code = 'ING-003'
      LIMIT 1
    `);
    const flourStock = ((flourRes as any).rows || flourRes)?.[0]?.currentStock ?? 0;

    const dishes = dishRows.map((dish: any) => {
      const variants = variantRows.filter((v: any) => v.dishId === dish.id);
      let availablePortions = 0;

      if (dish.preparationPolicy === 'READY_BATCH') {
        const batch = batchRows.find((b: any) => b.dishId === dish.id && b.remainingUsableYield > 0);
        if (batch && variants[0]) {
          availablePortions = calculateMaxPortions(batch.remainingUsableYield, variants[0].portionQuantity);
        }
      } else if (dish.preparationPolicy === 'FRESH_ORDER') {
        // 120g rice flour per portion of 2 rotti
        availablePortions = Math.floor(flourStock / 120);
      }

      return {
        ...dish,
        variants,
        availablePortions,
        isSoldOut: availablePortions <= 0
      };
    });

    return {
      success: true,
      data: { dishes }
    };
  });

  // Admin: create dish
  fastify.post('/dishes', async (request, reply) => {
    const { code, nameEn, nameKn, preparationPolicy, imageUrl, variants, branchId } = request.body as any;
    if (!code || !nameEn || !preparationPolicy) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'code, nameEn, preparationPolicy are required' }
      });
    }

    const db = await getDatabase();
    const dishId = 'dish-' + crypto.randomUUID();
    const bId = branchId || 'branch-blr-vvp-01';

    await db.transaction(async (tx: any) => {
      await tx.execute(sql`
        INSERT INTO dishes (id, branch_id, recipe_id, active_version_id, code, name_en, name_kn, preparation_policy, image_url, is_active)
        VALUES (${dishId}, ${bId}, ${dishId}, ${dishId}, ${code}, ${nameEn}, ${nameKn || nameEn}, ${preparationPolicy}, ${imageUrl || '/demo-media/dishes/bassaru.webp'}, true)
      `);

      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          await tx.execute(sql`
            INSERT INTO dish_variants (id, dish_id, name_en, name_kn, portion_quantity, portion_unit, price_paise)
            VALUES (${'var-' + crypto.randomUUID()}, ${dishId}, ${v.nameEn}, ${v.nameKn || v.nameEn}, ${v.portionQuantity || 1}, ${v.portionUnit || 'pcs'}, ${v.pricePaise || 5000})
          `);
        }
      }
    });

    return { success: true, data: { id: dishId, code, nameEn } };
  });

  // Admin: publish / unpublish dish
  fastify.patch('/dishes/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { isActive } = request.body as { isActive: boolean };

    const db = await getDatabase();
    await db.execute(sql`
      UPDATE dishes
      SET is_active = ${isActive}
      WHERE id = ${id}
    `);

    return { success: true, data: { id, isActive } };
  });
};
