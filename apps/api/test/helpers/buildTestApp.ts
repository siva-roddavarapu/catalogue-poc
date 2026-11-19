import { buildApp } from '../../src/app';
import type { Config } from '../../src/config';
import { FixtureProductSource } from '../../src/adapters/products/FixtureProductSource';
import { CatalogueService } from '../../src/services/catalogue.service';
import { testProducts } from './testProducts';

export const testConfig: Config = {
  PORT: 3000,
  WEB_ORIGIN: 'http://localhost:5173',
  PRODUCT_SOURCE: 'fixture',
  FAKESTORE_BASE_URL: undefined,
  CACHE_TTL_SECONDS: 300,
  CURRENCY: 'USD',
  SMTP_HOST: 'localhost',
  SMTP_PORT: 1025,
  SMTP_FROM: 'catalogue@example.com',
  SALES_INBOX: 'sales@example.com',
};

/** Builds the real Fastify app wired to in-memory adapters and the 8 test products. No network. */
export function buildTestApp() {
  const catalogue = new CatalogueService(
    new FixtureProductSource(testProducts),
    testConfig.CURRENCY,
  );
  return buildApp({ config: testConfig, catalogue }, { logger: false });
}
