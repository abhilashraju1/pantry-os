import { FastifyPluginAsync } from 'fastify';
import { store } from '../store/memory-store.js';

export const inventoryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/inventory/items', async () => {
    const items = store.ingredients.map((ing) => ({
      ...ing,
      isLowStock: ing.currentStock <= ing.reorderLevel
    }));

    return {
      success: true,
      data: {
        items,
        totalItems: items.length,
        lowStockCount: items.filter((i) => i.isLowStock).length
      }
    };
  });

  fastify.post('/inventory/receipts', async (request, reply) => {
    const { ingredientId, quantity, unitCostPaise, lotNumber, expiresAt } = request.body as {
      ingredientId: string;
      quantity: number;
      unitCostPaise: number;
      lotNumber: string;
      expiresAt: string;
    };

    const ingredient = store.ingredients.find((i) => i.id === ingredientId);
    if (!ingredient) {
      return reply.status(404).send({
        success: false,
        error: { code: 'INGREDIENT_NOT_FOUND', message: 'Ingredient does not exist' }
      });
    }

    const newLot = {
      id: `lot-${Date.now()}`,
      lotNumber,
      ingredientId,
      initialQuantity: quantity,
      availableQuantity: quantity,
      reservedQuantity: 0,
      unitCostPaise,
      receivedAt: new Date().toISOString(),
      expiresAt,
      status: 'AVAILABLE' as const
    };

    store.stockLots.push(newLot);
    ingredient.currentStock += quantity;

    return {
      success: true,
      data: { lot: newLot, currentStock: ingredient.currentStock }
    };
  });
};
