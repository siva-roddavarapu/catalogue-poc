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

describe('CatalogueService.getCategoryProducts (AC2)', () => {
  it('logs curated IDs that are not in the category', async () => {
    const warn = vi.fn();
    await buildTestCatalogue({ logger: { warn } }).getCategoryProducts('electronics');
    expect(warn).toHaveBeenCalledWith(
      { placement: 'category:electronics', missing: [4] },
      expect.any(String),
    );
  });
});

describe('CatalogueService.search (AC3)', () => {
  const searchIds = async (term: string) =>
    (await buildTestCatalogue().search(term)).map((p) => p.id);

  it('is case-insensitive and matches title or description', async () => {
    // 1 has "Backpack" in its title; 6 has "backpack" in its description.
    expect(await searchIds('BACKPACK')).toEqual([1, 6]);
  });

  it('matches the category name', async () => {
    expect(await searchIds('jewel')).toEqual([4, 5]);
    expect(await searchIds("men's")).toEqual([1, 2, 3]);
  });

  it('returns only matching products, or none', async () => {
    expect(await searchIds('drive')).toEqual([6, 8]);
    expect(await searchIds('zzz-no-such-thing')).toEqual([]);
  });
});
