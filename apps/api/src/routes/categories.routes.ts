import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { categorySlugSchema, type Category, type CategoryProducts } from '@catalogue/shared';
import type { CatalogueService } from '../services/catalogue.service';

const categoryParams = z.object({ slug: categorySlugSchema });

/** HTTP only: validate input -> call the service -> respond. */
export const categoriesRoutes: FastifyPluginAsync<{ catalogue: CatalogueService }> = async (
  app,
  { catalogue },
) => {
  app.get('/categories', async (): Promise<Category[]> => catalogue.listCategories());

  app.get('/categories/:slug/products', async (request): Promise<CategoryProducts> => {
    const { slug } = categoryParams.parse(request.params);
    return catalogue.getCategoryProducts(slug);
  });
};
