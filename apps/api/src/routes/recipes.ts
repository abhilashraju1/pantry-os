import { FastifyPluginAsync } from 'fastify';
import { store } from '../store/memory-store.js';
import { calculateMaxPortions } from '@pantryos/business-rules';

export const recipeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/menu', async () => {
    // Dynamic portion availability calculation based on real ready batches and raw ingredients
    const menu = store.dishes.map((dish) => {
      let availablePortions = 0;

      if (dish.preparationPolicy === 'READY_BATCH') {
        const activeBatch = store.batches.find(
          (b) => b.dishId === dish.id && (b.status === 'READY' || b.status === 'HOLDING')
        );

        if (activeBatch && activeBatch.remainingUsableYield) {
          const variant = dish.variants[0];
          availablePortions = calculateMaxPortions(activeBatch.remainingUsableYield, variant.portionQuantity);
        }
      } else if (dish.preparationPolicy === 'FRESH_ORDER') {
        // Fresh order availability bounded by rice flour stock (120g per order of 2)
        const flour = store.ingredients.find((i) => i.id === 'ing-rice-flour');
        if (flour) {
          availablePortions = Math.floor(flour.currentStock / 120);
        }
      }

      return {
        ...dish,
        availablePortions,
        isSoldOut: availablePortions <= 0
      };
    });

    return {
      success: true,
      data: { dishes: menu }
    };
  });
};
