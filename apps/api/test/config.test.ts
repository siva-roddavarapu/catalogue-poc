import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../src/config';

const valid = {
  PRODUCT_SOURCE: 'fixture',
  SMTP_FROM: 'catalogue@example.com',
  SALES_INBOX: 'sales@example.com',
};

describe('loadConfig', () => {
  it('applies defaults to a minimal valid env', () => {
    const config = loadConfig(valid);
    expect(config).toMatchObject({ PORT: 3000, CURRENCY: 'USD', CACHE_TTL_SECONDS: 300 });
  });

  it('fails fast and names every bad variable', () => {
    const run = () => loadConfig({ ...valid, SALES_INBOX: 'not-an-email', CURRENCY: 'dollars' });
    expect(run).toThrow(ConfigError);
    expect(run).toThrow(/SALES_INBOX[\s\S]*CURRENCY|CURRENCY[\s\S]*SALES_INBOX/);
  });

  it('requires FAKESTORE_BASE_URL only when the live source is selected', () => {
    expect(() => loadConfig({ ...valid, PRODUCT_SOURCE: 'fakestore' })).toThrow(
      /FAKESTORE_BASE_URL/,
    );
  });
});
