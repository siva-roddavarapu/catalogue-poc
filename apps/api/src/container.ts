import path from 'node:path';
import { pino } from 'pino';
import type { AppDeps } from './app';
import type { Config } from './config';
import type { ProductSource } from './ports/ProductSource';
import { FakeStoreProductSource } from './adapters/products/FakeStoreProductSource';
import { FixtureProductSource } from './adapters/products/FixtureProductSource';
import { JsonFileMerchandising } from './adapters/merchandising/JsonFileMerchandising';
import { CatalogueService } from './services/catalogue.service';

// apps/api/src -> repo root. Same depth in the Docker image (/app/apps/api/src -> /app).
const MERCHANDISING_FILE = path.resolve(import.meta.dirname, '../../../config/merchandising.json');

/**
 * Composition root: the ONE place that decides which adapter implements each port,
 * based on validated config. Nothing else in the app constructs adapters.
 * Throws ConfigError on bad config, so startup fails fast.
 */
export function createContainer(config: Config): AppDeps {
  const logger = pino();

  const source: ProductSource =
    config.PRODUCT_SOURCE === 'fixture' || !config.FAKESTORE_BASE_URL
      ? new FixtureProductSource()
      : new FakeStoreProductSource({
          baseUrl: config.FAKESTORE_BASE_URL,
          cacheTtlMs: config.CACHE_TTL_SECONDS * 1000,
        });

  const merchandising = JsonFileMerchandising.fromFile(MERCHANDISING_FILE);

  return {
    config,
    logger,
    catalogue: new CatalogueService({ source, merchandising, currency: config.CURRENCY, logger }),
  };
}
