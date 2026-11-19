import { describe, expect, it, vi } from 'vitest';
import { buildTestCatalogue, testMerchandising } from './helpers/buildTestApp';

describe('CatalogueService.getFeatured (AC1)', () => {
  it('returns exactly the 5 curated products, in curated order', async () => {
    const featured = await buildTestCatalogue().getFeatured();
    expect(featured.map((p) => p.id)).toEqual([7, 1, 4, 6, 2]);
    expect(featured.every((p) => p.currency === 'USD')).toBe(true);
  });

  it('skips curated IDs the source no longer has, and logs a warning', async () => {
    const warn = vi.fn();
    const catalogue = buildTestCatalogue({
      merchandising: { ...testMerchandising, homeFeatured: [1, 99, 2, 3, 4] },
      logger: { warn },
    });

    const featured = await catalogue.getFeatured();

    expect(featured.map((p) => p.id)).toEqual([1, 2, 3, 4]);
    expect(warn).toHaveBeenCalledWith({ placement: 'home', missing: [99] }, expect.any(String));
  });
});
