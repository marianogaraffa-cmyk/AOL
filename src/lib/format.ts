export function formatCurrency(amount: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMonth(period: string) {
  return new Intl.DateTimeFormat("es-MX", {
    month: "short",
    year: "2-digit",
  }).format(new Date(`${period}T00:00:00`));
}
