import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { JsonFileMerchandising } from '../src/adapters/merchandising/JsonFileMerchandising';
import { ConfigError } from '../src/config';

describe('JsonFileMerchandising startup validation', () => {
  it.each([
    ['fewer than 5', [1, 2, 3, 4]],
    ['more than 5', [1, 2, 3, 4, 5, 6]],
    ['duplicates', [1, 1, 2, 3, 4]],
    ['non-integer', [1, 2, 3, 4, 'five']],
  ])('rejects homeFeatured with %s', (_case, homeFeatured) => {
    expect(() => new JsonFileMerchandising({ homeFeatured })).toThrow(ConfigError);
  });

  it('loads and validates the committed config/merchandising.json', async () => {
    const file = path.resolve(import.meta.dirname, '../../../config/merchandising.json');
    await expect(JsonFileMerchandising.fromFile(file).getHomeFeatured()).resolves.toEqual([
      1, 5, 9, 14, 18,
    ]);
  });

  it('fails with a clear message when the file is missing', () => {
    expect(() => JsonFileMerchandising.fromFile('/nope/merchandising.json')).toThrow(
      /Cannot read merchandising config/,
    );
  });
});
