import type { Product } from '@catalogue/shared';

/** A product as a data source knows it. Currency is our business rule, added by the service. */
export type SourceProduct = Omit<Product, 'currency'>;

/** Where product data comes from. Swap the adapter, not the callers (Fake Store today). */
export interface ProductSource {
  listProducts(): Promise<SourceProduct[]>;
  /** Resolves to null when no product has this id. */
  getProduct(id: number): Promise<SourceProduct | null>;
}
