import type { Product } from '@catalogue/shared';
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

  async getProduct(id: number): Promise<Product> {
    const product = await this.deps.source.getProduct(id);
    if (!product) throw new NotFoundError(`Product ${id} not found`);
    return this.toProduct(product);
  }

  /** Curated IDs -> products, keeping curated order and logging any ID the source doesn't have. */
  private pick(ids: number[], products: SourceProduct[], placement: string): Product[] {
    const byId = new Map(products.map((product) => [product.id, product]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      this.deps.logger.warn({ placement, missing }, 'Curated product IDs not found; skipping them');
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
