import { pino } from 'pino';
import { buildApp } from '../../src/app';
import type { Config } from '../../src/config';
import type { SourceProduct } from '../../src/ports/ProductSource';
import type { EmailSender } from '../../src/ports/EmailSender';
import type { Logger } from '../../src/ports/Logger';
import { FixtureProductSource } from '../../src/adapters/products/FixtureProductSource';
import { JsonFileMerchandising } from '../../src/adapters/merchandising/JsonFileMerchandising';
import { InMemoryEmailSender } from '../../src/adapters/email/InMemoryEmailSender';
import { CatalogueService } from '../../src/services/catalogue.service';
import { EnquiryService } from '../../src/services/enquiry.service';
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

/** Curation for the 8 test products. Deliberately not in ID order, so ordering is tested. */
export const testMerchandising = {
  homeFeatured: [7, 1, 4, 6, 2],
  // Electronics includes 4 (a jewelery item) to prove off-category IDs are skipped.
  // Jewelery is deliberately not curated.
  categoryFeatured: { 'mens-clothing': [3, 1], electronics: [8, 4, 6] },
};

const silentLogger: Logger = { info: () => {}, warn: () => {} };

export function buildTestCatalogue(
  options: { products?: SourceProduct[]; merchandising?: unknown; logger?: Partial<Logger> } = {},
) {
  return new CatalogueService({
    source: new FixtureProductSource(options.products ?? testProducts),
    merchandising: new JsonFileMerchandising(options.merchandising ?? testMerchandising),
    currency: testConfig.CURRENCY,
    logger: { ...silentLogger, ...options.logger },
  });
}

/**
 * Builds the real Fastify app wired to in-memory adapters and the 8 test products. No network.
 * Returns the email outbox so tests can assert on what would have been sent.
 */
export function buildTestApp(options: { email?: EmailSender } = {}) {
  const outbox = new InMemoryEmailSender();
  const catalogue = buildTestCatalogue();
  const app = buildApp({
    config: testConfig,
    logger: pino({ level: 'silent' }),
    catalogue,
    enquiries: new EnquiryService({
      catalogue,
      email: options.email ?? outbox,
      salesInbox: testConfig.SALES_INBOX,
      from: testConfig.SMTP_FROM,
      webOrigin: testConfig.WEB_ORIGIN,
      logger: silentLogger,
    }),
  });
  return Object.assign(app, { outbox });
}
