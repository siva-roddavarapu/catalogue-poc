import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { productIdSchema, type Product } from '@catalogue/shared';
import type { CatalogueService } from '../services/catalogue.service';

const productParams = z.object({ id: productIdSchema });

/** HTTP only: validate input -> call the service -> respond. A ZodError becomes a 400. */
export const productsRoutes: FastifyPluginAsync<{ catalogue: CatalogueService }> = async (
  app,
  { catalogue },
) => {
  app.get('/products/featured', async (): Promise<Product[]> => catalogue.getFeatured());

  // Declared after the static routes above for readability (Fastify gives static paths priority anyway).
  app.get('/products/:id', async (request): Promise<Product> => {
    const { id } = productParams.parse(request.params);
    return catalogue.getProduct(id);
  });
};
