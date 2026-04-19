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

function computeDelta(data: RevenueActivityDatum[], key: "revenue" | "activity"): number {
  if (data.length < 2) return 0;
  const prev = data[data.length - 2]?.[key] ?? 0;
  const curr = data[data.length - 1]?.[key] ?? 0;
  if (prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}

function DeltaBadge({ delta }: { delta: number }) {
  const positive = delta >= 0;
  const label = `${positive ? "+" : ""}${delta.toFixed(1)}%`;
  return (
    <span
      className={[
        "status-pill",
        positive ? "status-pill-success" : "status-pill-danger",
      ].join(" ")}
    >
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={positive ? "M7 17L17 7M7 7h10v10" : "M7 7L17 17M17 7v10H7"}
        />
      </svg>
      {label}
    </span>
  );
}

export function RevenueActivityChart({
  title,
  description,
  revenueLabel,
  activityLabel,
  locale,
  data,
}: RevenueActivityChartProps) {
  const latest = data[data.length - 1];
  const revenueDelta = computeDelta(data, "revenue");
  const activityDelta = computeDelta(data, "activity");

  return (
    <section className="dashboard-shell-surface">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="dashboard-kicker">{title}</p>
          <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.025em] text-[#0a1628]">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#475467]">{description}</p>
        </div>

        <div className="flex flex-wrap items-stretch gap-3">
          <div className="rounded-lg border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#667085]">
              <span className="h-2 w-2 rounded-full bg-[#036deb]" />
              {revenueLabel}
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-lg font-semibold text-[#0a1628]">
                {formatCompact(locale, latest?.revenue ?? 0)}
              </p>
              <DeltaBadge delta={revenueDelta} />
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#667085]">
              <span className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
              {activityLabel}
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-lg font-semibold text-[#0a1628]">
                {formatCompact(locale, latest?.activity ?? 0)}
              </p>
              <DeltaBadge delta={activityDelta} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="hostinvoRevenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#036deb" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#036deb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hostinvoActivityFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#eef0f4" strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "#667085", fontSize: 11.5 }}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#667085", fontSize: 11.5 }}
              tickFormatter={(value: number) => formatCompact(locale, value)}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 12px 28px rgba(16,24,40,0.08)",
                fontSize: "12.5px",
              }}
              formatter={(value, name) => [formatCompact(locale, normalizeChartValue(value)), name]}
              labelStyle={{ color: "#0a1628", fontWeight: 600 }}
            />
            <Area
              dataKey="revenue"
              fill="url(#hostinvoRevenueFill)"
              name={revenueLabel}
              stroke="#036deb"
              strokeWidth={2.25}
              type="monotone"
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
            />
            <Area
              dataKey="activity"
              fill="url(#hostinvoActivityFill)"
              name={activityLabel}
              stroke="#0ea5e9"
              strokeWidth={2}
              type="monotone"
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
