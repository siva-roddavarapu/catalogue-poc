import { z } from 'zod';

/** Product IDs arrive as URL strings; a valid one is a positive integer. */
export const productIdSchema = z.coerce.number().int().positive();

/** Category slugs are lowercase letters, digits and hyphens, e.g. "mens-clothing". */
export const categorySlugSchema = z.string().regex(/^[a-z0-9-]{1,50}$/, 'invalid category slug');

export interface Category {
  /** URL-safe identifier, e.g. "mens-clothing". */
  slug: string;
  /** Display name, e.g. "Men's Clothing". */
  name: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  /** ISO 4217 code. Set by the API from config; the data source has none (DECISIONS A6). */
  currency: string;
  description: string;
  category: Category;
  image: string;
}

/** AC2: a category page. `topRated` (curated) and `others` never share a product. */
export interface CategoryProducts {
  category: Category;
  topRated: Product[];
  others: Product[];
}
