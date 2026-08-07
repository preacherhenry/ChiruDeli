export function formatK(amount: number): string {
  return `K${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}
