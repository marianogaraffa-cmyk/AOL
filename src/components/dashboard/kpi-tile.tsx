import { formatCurrency } from "@/lib/format";

export function KpiTile({
  label,
  amount,
  variant = "neutral",
}: {
  label: string;
  amount: number;
  variant?: "neutral" | "result";
}) {
  const isResult = variant === "result";
  const isPositive = amount >= 0;

  const valueClass = isResult
    ? isPositive
      ? "text-[#006300] dark:text-[#0ca30c]"
      : "text-[#d03b3b]"
    : "text-neutral-900 dark:text-neutral-100";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1 flex items-center gap-1.5 text-2xl font-semibold tabular-nums ${valueClass}`}>
        {isResult && <span aria-hidden>{isPositive ? "▲" : "▼"}</span>}
        {formatCurrency(amount)}
        {isResult && (
          <span className="text-xs font-normal text-neutral-500">
            {isPositive ? "positivo" : "negativo"}
          </span>
        )}
      </p>
    </div>
  );
}
