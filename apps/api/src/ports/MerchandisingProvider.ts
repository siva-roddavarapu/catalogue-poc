/** Owner-curated "top rated" picks. Curation is owner data, not product-source data (DECISIONS A1). */
export interface MerchandisingProvider {
  /** The product IDs the owner chose for the home page, in display order. */
  getHomeFeatured(): Promise<number[]>;
}
