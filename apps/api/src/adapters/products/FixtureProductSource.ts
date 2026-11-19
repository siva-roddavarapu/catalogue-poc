import type { ProductSource, SourceProduct } from '../../ports/ProductSource';
import snapshot from '../../fixtures/products.json' with { type: 'json' };

/**
 * Serves a fixed product list: the committed snapshot by default (PRODUCT_SOURCE=fixture,
 * works offline), or any list passed in (tests).
 */
export class FixtureProductSource implements ProductSource {
  private readonly products: SourceProduct[];

  constructor(products: SourceProduct[] = snapshot) {
    this.products = products;
  }

  async listProducts(): Promise<SourceProduct[]> {
    return this.products;
  }

  async getProduct(id: number): Promise<SourceProduct | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }
}
