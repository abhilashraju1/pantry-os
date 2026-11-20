import { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';
import { getDatabase } from '@pantryos/database';

export const reportRoutes: FastifyPluginAsync = async (fastify) => {
  // Sales summary report
  fastify.get('/reports/sales', async () => {
    const db = await getDatabase();

    const ordersRes = await db.execute(sql`
      SELECT
        COUNT(*)::int as "totalOrders",
        COALESCE(SUM(total_paise), 0)::int as "totalSalesPaise",
        COALESCE(SUM(tax_paise), 0)::int as "totalTaxPaise",
        COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_paise ELSE 0 END), 0)::int as "paidSalesPaise",
        COALESCE(SUM(CASE WHEN channel = 'WALK_IN_POS' THEN 1 ELSE 0 END), 0)::int as "posOrders",
        COALESCE(SUM(CASE WHEN channel = 'QR_TABLE' THEN 1 ELSE 0 END), 0)::int as "qrOrders",
        COALESCE(SUM(CASE WHEN channel = 'PHONE_PICKUP' THEN 1 ELSE 0 END), 0)::int as "pickupOrders",
        COALESCE(SUM(CASE WHEN channel LIKE 'MOCK_%' THEN 1 ELSE 0 END), 0)::int as "providerOrders"
      FROM orders
    `);
    const sales = ((ordersRes as any).rows || ordersRes)?.[0];

    return {
      success: true,
      data: {
        totalOrders: sales?.totalOrders ?? 0,
        totalSalesPaise: sales?.totalSalesPaise ?? 0,
        totalTaxPaise: sales?.totalTaxPaise ?? 0,
        paidSalesPaise: sales?.paidSalesPaise ?? 0,
        channelBreakdown: {
          pos: sales?.posOrders ?? 0,
          qr: sales?.qrOrders ?? 0,
          pickup: sales?.pickupOrders ?? 0,
          provider: sales?.providerOrders ?? 0
        }
      }
    };
  });

  // Ingredient usage & variance report (MarketMan style)
  fastify.get('/reports/variance', async () => {
    const db = await getDatabase();

    const result = await db.execute(sql`
      SELECT
        i.code as "ingredientCode",
        i.name_en as "nameEn",
        i.base_unit as "unit",
        i.current_stock::float as "currentStock",
        COALESCE(SUM(CASE WHEN m.movement_type = 'USAGE' OR m.movement_type = 'RESERVATION' THEN m.quantity ELSE 0 END), 0)::float as "actualUsage",
        COALESCE(SUM(CASE WHEN m.movement_type = 'WASTE' THEN m.quantity ELSE 0 END), 0)::float as "wasteQuantity"
      FROM ingredients i
      LEFT JOIN stock_movements m ON i.id = m.ingredient_id
      GROUP BY i.id, i.code, i.name_en, i.base_unit, i.current_stock
      ORDER BY i.name_en ASC
    `);

    const variance = (result as any).rows || result;
    return { success: true, data: { variance } };
  });
};
