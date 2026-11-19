import Fastify, { type FastifyInstance } from 'fastify';
import type { ApiErrorBody } from '@catalogue/shared';
import type { Config } from './config';
import { errorHandler } from './lib/errorHandler';
import { healthRoutes } from './routes/health.routes';

/** Everything the HTTP layer needs. Built by container.ts (real) or buildTestApp (tests). */
export interface AppDeps {
  config: Config;
}

export function buildApp(deps: AppDeps, options: { logger?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? true });

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler((request, reply) => {
    const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    return reply.status(404).send(body);
  });

  app.register(healthRoutes, { prefix: '/api' });

  return app;
}
