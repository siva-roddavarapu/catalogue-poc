import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';
import type { ApiErrorBody } from '@catalogue/shared';
import type { Config } from './config';
import { errorHandler } from './lib/errorHandler';
import { healthRoutes } from './routes/health.routes';
import { productsRoutes } from './routes/products.routes';
import type { CatalogueService } from './services/catalogue.service';

/** Everything the HTTP layer needs. Built by container.ts (real) or buildTestApp (tests). */
export interface AppDeps {
  config: Config;
  /** One logger shared by Fastify and the services. */
  logger: FastifyBaseLogger;
  catalogue: CatalogueService;
}

export function buildApp(deps: AppDeps): FastifyInstance {
  const app = Fastify({ loggerInstance: deps.logger });

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler((request, reply) => {
    const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    return reply.status(404).send(body);
  });

  app.register(healthRoutes, { prefix: '/api' });
  app.register(productsRoutes, { prefix: '/api', catalogue: deps.catalogue });

  return app;
}
