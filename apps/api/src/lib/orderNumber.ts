/** Human-readable order number, e.g. CD-260807-K3F9. Uniqueness is enforced
 * by the DB constraint on Order.orderNumber; collisions are astronomically
 * unlikely given the random suffix, but callers should retry once on 23505. */
export function generateOrderNumber(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CD-${yy}${mm}${dd}-${suffix}`;
}

export function generateDeliveryPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
