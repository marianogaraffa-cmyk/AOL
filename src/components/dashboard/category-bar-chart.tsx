"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

export type CategoryPoint = { name: string; amount: number };

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: CategoryPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-md dark:border-neutral-700 dark:bg-neutral-900">
      <p className="font-medium text-neutral-700 dark:text-neutral-300">{point.name}</p>
      <p className="tabular-nums">{formatCurrency(point.amount)}</p>
    </div>
  );
}

export function CategoryBarChart({
  data,
  hue,
}: {
  data: CategoryPoint[];
  hue: string;
}) {
  const height = Math.max(120, data.length * 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis
          type="number"
          tick={{ fill: "#898781", fontSize: 12 }}
          axisLine={{ stroke: "#c3c2b7" }}
          tickLine={false}
          tickFormatter={(v) => formatCurrency(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "#52514e", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(11,11,11,0.04)" }} />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={hue} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
