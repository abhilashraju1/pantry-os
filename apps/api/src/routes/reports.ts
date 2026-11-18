import { FastifyPluginAsync } from 'fastify';
import { store } from '../store/memory-store.js';

export const reportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/reports/variance', async () => {
    // MarketMan-style actual vs theoretical variance report
    const varianceItems = [
      {
        ingredientNameEn: 'Sona Masoori Rice',
        theoreticalUsageGrams: 1950, // 3 batches BBB * 650g
        actualUsageGrams: 2050,
        varianceGrams: 100, // 100g spillage
        variancePct: 5.1,
        lossPaise: 600 // ₹6.00
      },
      {
        ingredientNameEn: 'Toor Dal',
        theoreticalUsageGrams: 1850,
        actualUsageGrams: 1870,
        varianceGrams: 20,
        variancePct: 1.1,
        lossPaise: 320 // ₹3.20
      },
      {
        ingredientNameEn: 'Sunflower Cooking Oil',
        theoreticalUsageGrams: 510,
        actualUsageGrams: 520,
        varianceGrams: 10,
        variancePct: 2.0,
        lossPaise: 130 // ₹1.30
      }
    ];

    return {
      success: true,
      data: {
        reportPeriod: 'Today (Live Shift)',
        totalVarianceLossPaise: 1050, // ₹10.50
        varianceItems
      }
    };
  });

  fastify.get('/reports/sales', async () => {
    const totalSalesPaise = store.orders.reduce((sum, o) => sum + o.totalPaise, 0);
    const completedOrders = store.orders.filter((o) => o.status === 'COMPLETED').length;

    return {
      success: true,
      data: {
        totalOrders: store.orders.length,
        completedOrders,
        totalSalesPaise,
        branchCode: store.branch.code
      }
    };
  });
};
