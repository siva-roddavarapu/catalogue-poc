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
