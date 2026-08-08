export function formatK(amount: number): string {
  return `K${amount.toLocaleString('en-ZM', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
