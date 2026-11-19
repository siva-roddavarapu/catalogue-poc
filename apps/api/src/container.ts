import type { AppDeps } from './app';
import type { Config } from './config';
import type { ProductSource } from './ports/ProductSource';
import { FakeStoreProductSource } from './adapters/products/FakeStoreProductSource';
import { FixtureProductSource } from './adapters/products/FixtureProductSource';
import { CatalogueService } from './services/catalogue.service';

/**
 * Composition root: the ONE place that decides which adapter implements each port,
 * based on validated config. Nothing else in the app constructs adapters.
 */
export function createContainer(config: Config): AppDeps {
  const productSource: ProductSource =
    config.PRODUCT_SOURCE === 'fixture' || !config.FAKESTORE_BASE_URL
      ? new FixtureProductSource()
      : new FakeStoreProductSource({
          baseUrl: config.FAKESTORE_BASE_URL,
          cacheTtlMs: config.CACHE_TTL_SECONDS * 1000,
        });

  return {
    config,
    catalogue: new CatalogueService(productSource, config.CURRENCY),
  };
}
