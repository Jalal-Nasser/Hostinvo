"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMinorCurrency } from "@/lib/billing";
import { type TenantDashboardChartPoint, type TenantDashboardOverview } from "@/lib/dashboard";

type TenantSystemOverviewChartProps = {
  currency: string;
  data: TenantDashboardOverview["chart"];
  labels: {
    title: string;
    periods: Record<"today" | "last_30_days" | "last_year", string>;
    newOrders: string;
    activatedOrders: string;
    income: string;
  };
  locale: string;
};

function formatCompact(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
}

function normalizeValue(
  value: number | string | ReadonlyArray<number | string> | undefined,
): number {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0);
  }

  return Number(value ?? 0);
}

export function TenantSystemOverviewChart({
  currency,
  data,
  labels,
  locale,
}: TenantSystemOverviewChartProps) {
  const [period, setPeriod] = useState<TenantDashboardOverview["chart"]["default_period"]>(
    data.default_period,
  );

  const activeData = useMemo<TenantDashboardChartPoint[]>(() => data.series[period] ?? [], [data.series, period]);

  return (
    <article className="rounded-[4px] border border-[#d9dee6] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e5e7eb] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-[15px] font-medium text-[#1f2937]">{labels.title}</h2>
        <div className="inline-flex w-fit items-center rounded-[3px] border border-[#d1d5db] bg-[#f8fafc] p-0.5 text-[12px]">
          {(Object.keys(labels.periods) as Array<keyof typeof labels.periods>).map((key) => {
            const active = key === period;

            return (
              <button
                key={key}
                className={[
                  "min-w-[88px] rounded-[2px] px-3 py-1.5 transition",
                  active ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280]",
                ].join(" ")}
                onClick={() => setPeriod(key)}
                type="button"
              >
                {labels.periods[key]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 pb-4 pt-3">
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={activeData} margin={{ top: 12, right: 18, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="var(--dashboard-chart-grid, #e5e7eb)" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                minTickGap={18}
                tick={{ fill: "var(--dashboard-chart-tick, #6b7280)", fontSize: 11 }}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: "var(--dashboard-chart-tick, #6b7280)", fontSize: 11 }}
                tickFormatter={(value: number) => formatCompact(locale, value)}
                tickLine={false}
                width={44}
                yAxisId="orders"
              />
              <YAxis
                axisLine={false}
                orientation="right"
                tick={{ fill: "var(--dashboard-chart-tick, #6b7280)", fontSize: 11 }}
                tickFormatter={(value: number) => formatCompact(locale, value / 100)}
                tickLine={false}
                width={48}
                yAxisId="income"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--dashboard-tooltip-bg, #ffffff)",
                  border: "1px solid var(--dashboard-tooltip-border, #d1d5db)",
                  borderRadius: "6px",
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                  fontSize: "12px",
                }}
                formatter={(value, name) => {
                  const numericValue = normalizeValue(value);

                  if (name === labels.income) {
                    return [formatMinorCurrency(numericValue, currency, locale), name];
                  }

                  return [formatCompact(locale, numericValue), name];
                }}
                labelStyle={{ color: "var(--dashboard-tooltip-label, #111827)", fontWeight: 600 }}
              />
              <Legend
                formatter={(value) => <span className="text-[12px] text-[#4b5563]">{value}</span>}
                wrapperStyle={{ fontSize: "12px", paddingBottom: "8px" }}
              />
              <Bar
                dataKey="new_orders"
                fill="#d1d5db"
                maxBarSize={18}
                name={labels.newOrders}
                radius={[2, 2, 0, 0]}
                yAxisId="orders"
              />
              <Bar
                dataKey="activated_orders"
                fill="#5b78ff"
                maxBarSize={18}
                name={labels.activatedOrders}
                radius={[2, 2, 0, 0]}
                yAxisId="orders"
              />
              <Line
                activeDot={{ r: 4 }}
                dataKey="income_minor"
                dot={{ r: 2 }}
                name={labels.income}
                stroke="#5bc26a"
                strokeWidth={2.5}
                type="monotone"
                yAxisId="income"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </article>
  );
}
