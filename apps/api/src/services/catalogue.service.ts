import type { Product } from '@catalogue/shared';
import type { ProductSource, SourceProduct } from '../ports/ProductSource';
import { NotFoundError } from '../lib/errors';

/** Catalogue business rules. Knows ports only: no HTTP, no Fake Store. */
export class CatalogueService {
  private readonly source: ProductSource;
  private readonly currency: string;

  constructor(source: ProductSource, currency: string) {
    this.source = source;
    this.currency = currency;
  }

  async getProduct(id: number): Promise<Product> {
    const product = await this.source.getProduct(id);
    if (!product) throw new NotFoundError(`Product ${id} not found`);
    return this.toProduct(product);
  }

  private toProduct(product: SourceProduct): Product {
    return { ...product, currency: this.currency };
  }
}
