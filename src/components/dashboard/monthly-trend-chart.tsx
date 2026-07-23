"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatMonth } from "@/lib/format";

const COLOR_INGRESO = "#2a78d6";
const COLOR_EGRESO = "#eb6834";

export type MonthlyPoint = {
  period: string;
  ingreso: number;
  egreso: number;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-md dark:border-neutral-700 dark:bg-neutral-900">
      <p className="mb-1 font-medium text-neutral-700 dark:text-neutral-300">
        {formatMonth(label!)}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 tabular-nums">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: entry.dataKey === "ingreso" ? COLOR_INGRESO : COLOR_EGRESO,
            }}
          />
          <span className="text-neutral-500">
            {entry.dataKey === "ingreso" ? "Ingresos" : "Egresos"}:
          </span>
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function MonthlyTrendChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: COLOR_INGRESO }}
          />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: COLOR_EGRESO }}
          />
          Egresos
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e1e0d9" />
          <XAxis
            dataKey="period"
            tickFormatter={formatMonth}
            tick={{ fill: "#898781", fontSize: 12 }}
            axisLine={{ stroke: "#c3c2b7" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#898781", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrency(v)}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="ingreso"
            stroke={COLOR_INGRESO}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 0, fill: COLOR_INGRESO }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="egreso"
            stroke={COLOR_EGRESO}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 0, fill: COLOR_EGRESO }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
