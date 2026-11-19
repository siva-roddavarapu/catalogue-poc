import { describe, expect, it } from 'vitest';
import type { CategoryProducts } from '@catalogue/shared';
import { buildTestApp } from './helpers/buildTestApp';

const ids = (products: { id: number }[]) => products.map((p) => p.id);

describe('GET /api/categories', () => {
  it('lists each category once, with slug and display name, sorted by name', async () => {
    const res = await buildTestApp().inject({ method: 'GET', url: '/api/categories' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      { slug: 'electronics', name: 'Electronics' },
      { slug: 'jewelery', name: 'Jewelery' },
      { slug: 'mens-clothing', name: "Men's Clothing" },
    ]);
  });
});

describe('GET /api/categories/:slug/products (AC2)', () => {
  it('returns curated top-rated products first, then the rest, with no overlap', async () => {
    const res = await buildTestApp().inject({
      method: 'GET',
      url: '/api/categories/mens-clothing/products',
    });
    expect(res.statusCode).toBe(200);
    const body: CategoryProducts = res.json();

    expect(body.category).toEqual({ slug: 'mens-clothing', name: "Men's Clothing" });
    expect(ids(body.topRated)).toEqual([3, 1]); // curated order
    expect(ids(body.others)).toEqual([2]);
    for (const product of [...body.topRated, ...body.others]) {
      expect(product.category.slug).toBe('mens-clothing');
    }
  });

  it('skips curated IDs that belong to another category', async () => {
    const res = await buildTestApp().inject({
      method: 'GET',
      url: '/api/categories/electronics/products',
    });
    const body: CategoryProducts = res.json();
    expect(ids(body.topRated)).toEqual([8, 6]);
    expect(ids(body.others)).toEqual([7]);
  });

  it('returns no top-rated products for an uncurated category', async () => {
    const res = await buildTestApp().inject({
      method: 'GET',
      url: '/api/categories/jewelery/products',
    });
    const body: CategoryProducts = res.json();
    expect(body.topRated).toEqual([]);
    expect(ids(body.others)).toEqual([4, 5]);
  });

  it('returns 404 for an unknown category', async () => {
    const res = await buildTestApp().inject({
      method: 'GET',
      url: '/api/categories/hats/products',
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toEqual({ code: 'NOT_FOUND', message: "Category 'hats' not found" });
  });

  it('returns 400 for a malformed slug', async () => {
    const res = await buildTestApp().inject({
      method: 'GET',
      url: "/api/categories/Men's%20Clothing/products",
    });
    expect(res.statusCode).toBe(400);
  });
});
