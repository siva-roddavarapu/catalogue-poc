import type { Category, CategoryProducts, Product } from '@catalogue/shared';
import type { Logger } from '../ports/Logger';
import type { MerchandisingProvider } from '../ports/MerchandisingProvider';
import type { ProductSource, SourceProduct } from '../ports/ProductSource';
import { NotFoundError } from '../lib/errors';

export interface CatalogueDeps {
  source: ProductSource;
  merchandising: MerchandisingProvider;
  currency: string;
  logger: Logger;
}

/** Catalogue business rules. Knows ports only: no HTTP, no Fake Store. */
export class CatalogueService {
  private readonly deps: CatalogueDeps;

  constructor(deps: CatalogueDeps) {
    this.deps = deps;
  }

  /** AC1: the owner's 5 home picks, in the configured order. Unknown IDs are skipped, not fatal. */
  async getFeatured(): Promise<Product[]> {
    const ids = await this.deps.merchandising.getHomeFeatured();
    return this.pick(ids, await this.deps.source.listProducts(), 'home');
  }

  async listCategories(): Promise<Category[]> {
    return this.deps.source.listCategories();
  }

  /**
   * AC2: the owner's top-rated picks for a category, then the rest of that category.
   * Curated IDs from another category are skipped (and logged), so the two lists never overlap.
   */
  async getCategoryProducts(slug: string): Promise<CategoryProducts> {
    const categories = await this.deps.source.listCategories();
    const category = categories.find((c) => c.slug === slug);
    if (!category) throw new NotFoundError(`Category '${slug}' not found`);

    const inCategory = (await this.deps.source.listProducts()).filter(
      (product) => product.category.slug === slug,
    );
    const curatedIds = await this.deps.merchandising.getCategoryFeatured(slug);
    const topRated = this.pick(curatedIds, inCategory, `category:${slug}`);
    const topRatedIds = new Set(topRated.map((product) => product.id));

    return {
      category,
      topRated,
      others: inCategory
        .filter((product) => !topRatedIds.has(product.id))
        .map((product) => this.toProduct(product)),
    };
  }

  async getProduct(id: number): Promise<Product> {
    const product = await this.deps.source.getProduct(id);
    if (!product) throw new NotFoundError(`Product ${id} not found`);
    return this.toProduct(product);
  }

  /** Curated IDs -> products, keeping curated order and logging any ID not in `products`. */
  private pick(ids: number[], products: SourceProduct[], placement: string): Product[] {
    const byId = new Map(products.map((product) => [product.id, product]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      this.deps.logger.warn({ placement, missing }, 'Curated product IDs not available; skipping');
    }
    return ids.flatMap((id) => {
      const product = byId.get(id);
      return product ? [this.toProduct(product)] : [];
    });
  }

  private toProduct(product: SourceProduct): Product {
    return { ...product, currency: this.deps.currency };
  }
}
