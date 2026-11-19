import { z } from 'zod';
import type { ProductSource, SourceProduct } from '../../ports/ProductSource';
import { UpstreamError } from '../../lib/errors';
import type { Category } from '@catalogue/shared';
import { toCategoryName, toCategorySlug, uniqueCategories } from './categorySlug';

/**
 * The ONLY file that knows Fake Store (https://fakestoreapi.com) exists.
 * It fetches the whole list (20 items), validates and maps it to our shape, and caches it.
 */

// Upstream contract. Validating it means a shape change fails loudly here, not deep in the UI.
const fakeStoreProductsSchema = z.array(
  z.object({
    id: z.number().int(),
    title: z.string(),
    price: z.number(),
    description: z.string(),
    category: z.string(),
    image: z.string(),
  }),
);

export interface FakeStoreOptions {
  baseUrl: string;
  cacheTtlMs: number;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  now?: () => number;
}

export class FakeStoreProductSource implements ProductSource {
  private cache: { products: SourceProduct[]; fetchedAt: number } | null = null;
  private readonly options: Required<FakeStoreOptions>;

  constructor(options: FakeStoreOptions) {
    this.options = { timeoutMs: 5000, fetchFn: fetch, now: Date.now, ...options };
  }

  async listProducts(): Promise<SourceProduct[]> {
    const { cacheTtlMs, now } = this.options;
    if (this.cache && now() - this.cache.fetchedAt < cacheTtlMs) return this.cache.products;

    try {
      const products = await this.fetchProducts();
      this.cache = { products, fetchedAt: now() };
      return products;
    } catch (error) {
      // Upstream is down but we have older data: serving it beats an error page.
      if (this.cache) return this.cache.products;
      throw new UpstreamError(error);
    }
  }

  // Fake Store answers an unknown /products/:id with HTTP 200 and an empty body, so we use the
  // cached list instead: one code path, and no extra request per product page.
  async getProduct(id: number): Promise<SourceProduct | null> {
    const products = await this.listProducts();
    return products.find((product) => product.id === id) ?? null;
  }

  // Derived from the cached list: no extra request, and slugs always match the products' slugs.
  async listCategories(): Promise<Category[]> {
    return uniqueCategories(await this.listProducts());
  }

  private async fetchProducts(): Promise<SourceProduct[]> {
    const { baseUrl, timeoutMs, fetchFn } = this.options;
    const res = await fetchFn(new URL('/products', baseUrl), {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`Fake Store responded ${res.status}`);

    return fakeStoreProductsSchema.parse(await res.json()).map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      description: p.description,
      category: { slug: toCategorySlug(p.category), name: toCategoryName(p.category) },
      image: p.image,
    }));
  }
}
