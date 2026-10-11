/**
 * Deterministic price formatter that avoids SSR / Client hydration mismatches
 * e.g. 360000 -> "360 000"
 */
export function formatPrice(price?: number | null): string {
  if (price === null || price === undefined || isNaN(price)) return '0';
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
