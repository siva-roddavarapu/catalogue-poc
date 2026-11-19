import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import type { ApiErrorBody } from '@catalogue/shared';
import type { Config } from './config';
import { errorHandler } from './lib/errorHandler';
import { categoriesRoutes } from './routes/categories.routes';
import { enquiriesRoutes } from './routes/enquiries.routes';
import { healthRoutes } from './routes/health.routes';
import { productsRoutes } from './routes/products.routes';
import type { CatalogueService } from './services/catalogue.service';
import type { EnquiryService } from './services/enquiry.service';

/** Everything the HTTP layer needs. Built by container.ts (real) or buildTestApp (tests). */
export interface AppDeps {
  config: Config;
  /** One logger shared by Fastify and the services. */
  logger: FastifyBaseLogger;
  catalogue: CatalogueService;
  enquiries: EnquiryService;
}

export function buildApp(deps: AppDeps): FastifyInstance {
  const app = Fastify({
    loggerInstance: deps.logger,
    // Requests are small JSON; refuse anything bigger than 10 KB early (default is 1 MB).
    bodyLimit: 10 * 1024,
    // Behind nginx / the Vite proxy every request comes from the proxy's IP. Trust
    // X-Forwarded-For only from loopback and private networks, so per-IP rate limiting
    // sees the real client and a public caller can't spoof its IP.
    trustProxy: ['loopback', 'uniquelocal'],
  });

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler((request, reply) => {
    const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    return reply.status(404).send(body);
  });

  // global: false = only routes that opt in (POST /api/enquiries) are rate limited.
  app.register(rateLimit, { global: false });
  app.register(healthRoutes, { prefix: '/api' });
  app.register(productsRoutes, { prefix: '/api', catalogue: deps.catalogue });
  app.register(categoriesRoutes, { prefix: '/api', catalogue: deps.catalogue });
  app.register(enquiriesRoutes, { prefix: '/api', enquiries: deps.enquiries });

  return app;
}
