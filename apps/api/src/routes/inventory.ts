import { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { getDatabase } from '@pantryos/database';

export const inventoryRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all inventory items & lots
  fastify.get('/inventory/items', async () => {
    const db = await getDatabase();
    const result = await db.execute(sql`
      SELECT id, code, name_en as "nameEn", name_kn as "nameKn", category,
             base_unit as "baseUnit", purchase_unit as "purchaseUnit",
             conversion_ratio_to_base::float as "conversionRatioToBase",
             reorder_level::float as "reorderLevel",
             current_stock::float as "currentStock",
             storage_location as "storageLocation"
      FROM ingredients
      ORDER BY name_en ASC
    `);

    const rows = (result as any).rows || result;
    const items = rows.map((ing: any) => ({
      ...ing,
      isLowStock: ing.currentStock <= ing.reorderLevel
    }));

    return {
      success: true,
      data: {
        items,
        totalItems: items.length,
        lowStockCount: items.filter((i: any) => i.isLowStock).length
      }
    };
  });

  // Admin create ingredient
  fastify.post('/inventory/items', async (request, reply) => {
    const { code, nameEn, nameKn, category, baseUnit, purchaseUnit, conversionRatioToBase, reorderLevel, branchId } =
      request.body as any;

    if (!code || !nameEn || !category || !baseUnit) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'code, nameEn, category and baseUnit are required' }
      });
    }

    const db = await getDatabase();
    const id = 'ing-' + crypto.randomUUID();
    const bId = branchId || 'branch-blr-vvp-01';

    await db.execute(sql`
      INSERT INTO ingredients (id, branch_id, code, name_en, name_kn, category, base_unit, purchase_unit, conversion_ratio_to_base, reorder_level, current_stock)
      VALUES (
        ${id}, ${bId}, ${code}, ${nameEn}, ${nameKn || nameEn}, ${category},
        ${baseUnit}, ${purchaseUnit || baseUnit}, ${conversionRatioToBase || 1}, ${reorderLevel || 0}, 0
      )
    `);

    return {
      success: true,
      data: {
        id, code, nameEn, category, baseUnit, currentStock: 0
      }
    };
  });

  // Receive stock lots
  fastify.post('/inventory/receipts', async (request, reply) => {
    const { ingredientId, quantity, unitCostPaise, lotNumber, expiresAt, branchId } = request.body as {
      ingredientId: string;
      quantity: number;
      unitCostPaise: number;
      lotNumber: string;
      expiresAt: string;
      branchId?: string;
    };

    const db = await getDatabase();
    const ingRes = await db.execute(sql`SELECT id, branch_id, current_stock::float FROM ingredients WHERE id = ${ingredientId}`);
    const ing = ((ingRes as any).rows || ingRes)?.[0];

    if (!ing) {
      return reply.status(404).send({
        success: false,
        error: { code: 'INGREDIENT_NOT_FOUND', message: 'Ingredient does not exist' }
      });
    }

    const lotId = 'lot-' + crypto.randomUUID();
    const bId = branchId || ing.branch_id || 'branch-blr-vvp-01';
    const lotNum = lotNumber || `LOT-${Date.now()}`;
    const exp = expiresAt || new Date(Date.now() + 180 * 86400 * 1000).toISOString();

    await db.transaction(async (tx: any) => {
      // 1. Insert lot
      await tx.execute(sql`
        INSERT INTO stock_lots (id, branch_id, ingredient_id, lot_number, initial_quantity, available_quantity, reserved_quantity, unit_cost_paise, expires_at, status)
        VALUES (${lotId}, ${bId}, ${ingredientId}, ${lotNum}, ${quantity}, ${quantity}, 0, ${unitCostPaise || 0}, ${exp}, 'AVAILABLE')
      `);

      // 2. Update ingredient stock
      await tx.execute(sql`
        UPDATE ingredients
        SET current_stock = current_stock + ${quantity}
        WHERE id = ${ingredientId}
      `);

      // 3. Insert stock movement
      await tx.execute(sql`
        INSERT INTO stock_movements (id, branch_id, ingredient_id, lot_id, movement_type, quantity, unit_cost_paise, reason)
        VALUES (${'mov-' + crypto.randomUUID()}, ${bId}, ${ingredientId}, ${lotId}, 'RECEIPT', ${quantity}, ${unitCostPaise || 0}, 'Stock receipt')
      `);
    });

    return {
      success: true,
      data: {
        lot: { id: lotId, lotNumber: lotNum, quantity, expiresAt: exp },
        currentStock: ing.current_stock + quantity
      }
    };
  });
};
