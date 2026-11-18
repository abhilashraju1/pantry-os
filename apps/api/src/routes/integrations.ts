import { FastifyPluginAsync } from 'fastify';
import { store } from '../store/memory-store.js';

export const integrationRoutes: FastifyPluginAsync = async (fastify) => {
  // Beckn RET11 on_search response mock
  fastify.post('/integrations/ondc/search', async (request) => {
    const { transactionId } = request.body as { transactionId: string };

    return {
      context: {
        domain: 'ONDC:RET11',
        country: 'IND',
        city: 'std:080',
        action: 'on_search',
        core_version: '1.2.0',
        transaction_id: transactionId || `txn_${Date.now()}`,
        timestamp: new Date().toISOString()
      },
      message: {
        catalog: {
          bpp_descriptor: {
            name: store.branch.name,
            symbol: '/demo-media/branding/logo.svg'
          },
          bpp_providers: [
            {
              id: store.branch.id,
              descriptor: { name: store.branch.name },
              items: store.dishes.map((d) => ({
                id: d.id,
                descriptor: { name: d.nameEn, short_desc: d.descriptionEn },
                price: { currency: 'INR', value: (d.variants[0].pricePaise / 100).toFixed(2) },
                tags: [{ code: 'veg', list: [{ code: 'veg', value: 'yes' }] }]
              }))
            }
          ]
        }
      }
    };
  });
};
