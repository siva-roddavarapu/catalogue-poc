import type { Category } from '@catalogue/shared';

/** "men's clothing" -> "mens-clothing" (URL-safe, stable). */
export function toCategorySlug(upstreamName: string): string {
  return upstreamName
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "men's clothing" -> "Men's Clothing" (for display). */
export function toCategoryName(upstreamName: string): string {
  return upstreamName.replace(/\b\p{L}/gu, (letter, offset: number, whole: string) =>
    // Don't capitalise the "s" after an apostrophe ("Men's", not "Men'S").
    offset > 0 && /['’]/.test(whole[offset - 1] ?? '') ? letter : letter.toUpperCase(),
  );
}

/** The distinct categories of a product list, sorted by display name (stable nav order). */
export function uniqueCategories(products: { category: Category }[]): Category[] {
  const bySlug = new Map(products.map((product) => [product.category.slug, product.category]));
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}
