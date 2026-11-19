import { describe, expect, it } from 'vitest';
import { buildTestApp } from './helpers/buildTestApp';

describe('GET /api/products/featured (AC1)', () => {
  it('returns the 5 curated home products in order', async () => {
    const res = await buildTestApp().inject({ method: 'GET', url: '/api/products/featured' });
    expect(res.statusCode).toBe(200);
    expect(res.json().map((p: { id: number }) => p.id)).toEqual([7, 1, 4, 6, 2]);
  });
});

describe('GET /api/products/:id (AC4)', () => {
  it('returns the product with the configured currency', async () => {
    const res = await buildTestApp().inject({ method: 'GET', url: '/api/products/4' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      id: 4,
      title: 'Gold Bracelet',
      price: 40.99,
      currency: 'USD',
      category: { slug: 'jewelery', name: 'Jewelery' },
    });
  });

  it('returns 404 in the standard error shape for an unknown id', async () => {
    const res = await buildTestApp().inject({ method: 'GET', url: '/api/products/999' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Product 999 not found' } });
  });

  it.each(['abc', '0', '-1', '1.5'])('returns 400 for invalid id %j', async (id) => {
    const res = await buildTestApp().inject({ method: 'GET', url: `/api/products/${id}` });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });
});
