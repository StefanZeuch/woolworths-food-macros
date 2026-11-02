export function formatPrice(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(price)) return '—';
  return `R ${price.toFixed(2)}`;
}
