/** Formats a price for display, e.g. (40.99, "USD") -> "$40.99" in an en-US browser. */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}
