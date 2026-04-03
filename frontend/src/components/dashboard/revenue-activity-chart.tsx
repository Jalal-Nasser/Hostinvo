"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenueActivityDatum = {
  label: string;
  revenue: number;
  activity: number;
};

type RevenueActivityChartProps = {
  title: string;
  description: string;
  revenueLabel: string;
  activityLabel: string;
  locale: string;
  data: RevenueActivityDatum[];
};

function formatCompact(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

function normalizeChartValue(
  value: number | string | ReadonlyArray<number | string> | undefined,
): number {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0);
  }

  return Number(value ?? 0);
}

export function RevenueActivityChart({
  title,
  description,
  revenueLabel,
  activityLabel,
  locale,
  data,
}: RevenueActivityChartProps) {
  return (
    <section className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="dashboard-kicker">{title}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6b7280]">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8794]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#048dfe]" />
              {revenueLabel}
            </div>
            <p className="mt-2 text-xl font-semibold text-[#0a1628]">
              {formatCompact(locale, data[data.length - 1]?.revenue ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8794]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]" />
              {activityLabel}
            </div>
            <p className="mt-2 text-xl font-semibold text-[#0a1628]">
              {formatCompact(locale, data[data.length - 1]?.activity ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="hostinvoRevenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#048dfe" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#048dfe" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="hostinvoActivityFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#edf2f7" strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "#7b8794", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#7b8794", fontSize: 12 }}
              tickFormatter={(value: number) => formatCompact(locale, value)}
              tickLine={false}
              width={56}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
              }}
              formatter={(value, name) => [formatCompact(locale, normalizeChartValue(value)), name]}
              labelStyle={{ color: "#0a1628", fontWeight: 600 }}
            />
            <Area
              dataKey="revenue"
              fill="url(#hostinvoRevenueFill)"
              name={revenueLabel}
              stroke="#048dfe"
              strokeWidth={2.5}
              type="monotone"
            />
            <Area
              dataKey="activity"
              fill="url(#hostinvoActivityFill)"
              name={activityLabel}
              stroke="#7c3aed"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
