import path from 'node:path';
import { pino } from 'pino';
import type { AppDeps } from './app';
import type { Config } from './config';
import type { ProductSource } from './ports/ProductSource';
import { FakeStoreProductSource } from './adapters/products/FakeStoreProductSource';
import { FixtureProductSource } from './adapters/products/FixtureProductSource';
import { JsonFileMerchandising } from './adapters/merchandising/JsonFileMerchandising';
import { SmtpEmailSender } from './adapters/email/SmtpEmailSender';
import { CatalogueService } from './services/catalogue.service';
import { EnquiryService } from './services/enquiry.service';

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

  const catalogue = new CatalogueService({
    source,
    merchandising,
    currency: config.CURRENCY,
    logger,
  });

  return {
    config,
    logger,
    catalogue,
    enquiries: new EnquiryService({
      catalogue,
      email: new SmtpEmailSender({ host: config.SMTP_HOST, port: config.SMTP_PORT }),
      salesInbox: config.SALES_INBOX,
      from: config.SMTP_FROM,
      webOrigin: config.WEB_ORIGIN,
      logger,
    }),
  };
}
