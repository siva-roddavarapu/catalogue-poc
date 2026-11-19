import { describe, expect, it, vi } from 'vitest';
import { FakeStoreProductSource } from '../src/adapters/products/FakeStoreProductSource';
import { UpstreamError } from '../src/lib/errors';

const upstreamProduct = {
  id: 3,
  title: 'Mens Cotton Jacket',
  price: 55.99,
  description: 'Great outerwear.',
  category: "men's clothing",
  image: 'https://img.example.test/3.jpg',
  rating: { rate: 4.7, count: 500 },
};

const okResponse = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

function makeSource(fetchFn: typeof fetch, now = () => 0) {
  return new FakeStoreProductSource({
    baseUrl: 'https://upstream.test',
    cacheTtlMs: 60_000,
    fetchFn,
    now,
  });
}

describe('FakeStoreProductSource', () => {
  it('maps the upstream shape to ours (slug + display name, no rating)', async () => {
    const fetchFn = vi.fn(async () => okResponse([upstreamProduct]));
    const [product] = await makeSource(fetchFn).listProducts();

    expect(fetchFn).toHaveBeenCalledWith(
      new URL('https://upstream.test/products'),
      expect.anything(),
    );
    expect(product).toEqual({
      id: 3,
      title: 'Mens Cotton Jacket',
      price: 55.99,
      description: 'Great outerwear.',
      category: { slug: 'mens-clothing', name: "Men's Clothing" },
      image: 'https://img.example.test/3.jpg',
    });
  });

  it('serves from cache within the TTL, then refetches', async () => {
    let time = 0;
    const fetchFn = vi.fn(async () => okResponse([upstreamProduct]));
    const source = makeSource(fetchFn, () => time);

    await source.listProducts();
    time = 59_000;
    await source.getProduct(3);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    time = 61_000;
    await source.listProducts();
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('turns a timeout into an UpstreamError when there is no cache', async () => {
    const fetchFn = vi.fn(async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });
    await expect(makeSource(fetchFn).listProducts()).rejects.toBeInstanceOf(UpstreamError);
  });

  it('rejects an unexpected upstream shape or status as an UpstreamError', async () => {
    await expect(
      makeSource(vi.fn(async () => okResponse([{ id: 'x' }]))).listProducts(),
    ).rejects.toBeInstanceOf(UpstreamError);
    await expect(
      makeSource(vi.fn(async () => new Response('oops', { status: 500 }))).listProducts(),
    ).rejects.toBeInstanceOf(UpstreamError);
  });

  it('serves stale data if upstream fails after the cache expires', async () => {
    let time = 0;
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(okResponse([upstreamProduct]))
      .mockRejectedValueOnce(new TypeError('fetch failed'));
    const source = makeSource(fetchFn, () => time);

    await source.listProducts();
    time = 120_000;
    await expect(source.getProduct(3)).resolves.toMatchObject({ id: 3 });
  });
});
