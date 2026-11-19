import { buildApp } from '../../src/app';
import type { Config } from '../../src/config';

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

/** Builds the real Fastify app wired to in-memory/test adapters. No network. */
export function buildTestApp() {
  return buildApp({ config: testConfig }, { logger: false });
}
