import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TenantSystemOverviewChart } from "@/components/dashboard/tenant-system-overview-chart";
import { type AppLocale } from "@/i18n/routing";
import {
  canAccessAdminWorkspace,
  canAccessClientPortal,
  getAuthenticatedUserFromCookies,
  hasAnyPermission,
  isPlatformOwnerContext,
  localePath,
} from "@/lib/auth";
import { formatMinorCurrency } from "@/lib/billing";
import {
  fetchAdminDashboardSummary,
  fetchTenantDashboardOverviewFromCookies,
} from "@/lib/dashboard";

export const dynamic = "force-dynamic";

type DashboardPageProps = Readonly<{
  params: { locale: string };
}>;

function formatRelativeTime(locale: string, value: string | null): string {
  if (!value) {
    return "N/A";
  }

  const timestamp = new Date(value);
  const diffMs = timestamp.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(diffDays, "day");
}

function tenantDashboardActions(locale: string, t: Awaited<ReturnType<typeof getTranslations>>, user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUserFromCookies>>>) {
  return [
    hasAnyPermission(user, ["clients.manage"]) ? (
      <Link
        key="new-client"
        className="btn-primary whitespace-nowrap"
        href={localePath(locale, "/dashboard/clients/new")}
      >
        {t("newClientLink")}
      </Link>
    ) : null,
    hasAnyPermission(user, ["invoices.manage"]) ? (
      <Link
        key="new-invoice"
        className="btn-secondary whitespace-nowrap"
        href={localePath(locale, "/dashboard/invoices/new")}
      >
        {t("newInvoiceLink")}
      </Link>
    ) : null,
    hasAnyPermission(user, ["tickets.create", "tickets.manage"]) ? (
      <Link
        key="new-ticket"
        className="btn-ghost whitespace-nowrap"
        href={localePath(locale, "/dashboard/tickets/new")}
      >
        {t("newTicketLink")}
      </Link>
    ) : null,
  ].filter(Boolean);
}

function PlatformOwnerOverview({
  locale,
  t,
}: {
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const cards = [
    {
      title: t("tenantsLink"),
      description: "Manage tenant workspaces, switch context, and review license posture.",
      href: localePath(locale, "/dashboard/tenants"),
    },
    {
      title: t("platformPlansLink"),
      description: "Edit platform plans and public pricing from the owner workspace.",
      href: localePath(locale, "/dashboard/plans"),
    },
    {
      title: t("licenseBillingLink"),
      description: "Review SaaS license billing without entering a tenant workspace.",
      href: localePath(locale, "/dashboard/licenses"),
    },
  ];

  return (
    <DashboardShell
      currentPath="/dashboard"
      description={t("overviewDescription")}
      locale={locale as AppLocale}
      title={t("overviewTitlePlatformOwner")}
    >
      <section className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            className="rounded-[4px] border border-[#d9dee6] bg-white p-5 transition hover:border-[#c7d2e1]"
            href={card.href}
          >
            <h2 className="text-[15px] font-semibold text-[#111827]">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#4b5563]">{card.description}</p>
          </Link>
        ))}
      </section>
    </DashboardShell>
  );
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  setRequestLocale(params.locale);

  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);

  if (!user) {
    redirect(localePath(params.locale, "/auth/login"));
  }

  if (!canAccessAdminWorkspace(user) && canAccessClientPortal(user)) {
    redirect(localePath(params.locale, "/portal"));
  }

  const t = await getTranslations("Dashboard");
  const isPlatformOwner = isPlatformOwnerContext(user);

  if (isPlatformOwner) {
    return <PlatformOwnerOverview locale={params.locale} t={t} />;
  }

  const [overview, summary] = await Promise.all([
    fetchTenantDashboardOverviewFromCookies(cookieHeader),
    fetchAdminDashboardSummary(cookieHeader, user),
  ]);

  if (!overview) {
    return (
      <DashboardShell
        currentPath="/dashboard"
        description={t("overviewDescription")}
        locale={params.locale as AppLocale}
        title={t("overviewTitle")}
      >
        <section className="rounded-[4px] border border-[#d9dee6] bg-white p-6">
          <h2 className="text-[15px] font-semibold text-[#111827]">Dashboard service unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-[#4b5563]">
            The tenant overview endpoint did not return data for this workspace.
          </p>
        </section>
      </DashboardShell>
    );
  }

  const actions = tenantDashboardActions(params.locale, t, user);
  const statTiles = [
    {
      title: "Pending Orders",
      value: overview.counters.pending_orders,
      href: localePath(params.locale, "/dashboard/orders"),
      glow: "rgba(34,197,94,0.18)",
      border: "rgba(34,197,94,0.25)",
      valueBg: "rgba(34,197,94,0.12)",
      valueColor: "#4ade80",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7h13l-1.4 7.01A2 2 0 0116.64 16H9.12a2 2 0 01-1.96-1.61L5 4H3m6 16a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
      ),
    },
    {
      title: "Tickets Waiting",
      value: overview.counters.tickets_waiting,
      href: localePath(params.locale, "/dashboard/tickets"),
      glow: "rgba(236,72,153,0.18)",
      border: "rgba(236,72,153,0.28)",
      valueBg: "rgba(236,72,153,0.12)",
      valueColor: "#f472b6",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 10.5h8M8 14h5m-1-10a8 8 0 00-8 8v5l3-2h5a8 8 0 100-16z" />
        </svg>
      ),
    },
    {
      title: "Pending Cancellations",
      value: overview.counters.pending_cancellations,
      href: localePath(params.locale, "/dashboard/services"),
      glow: "rgba(251,146,60,0.18)",
      border: "rgba(251,146,60,0.28)",
      valueBg: "rgba(251,146,60,0.12)",
      valueColor: "#fb923c",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7.5h16M7 4v3.5m10-3.5v3.5M5.5 20h13A1.5 1.5 0 0020 18.5v-11A1.5 1.5 0 0018.5 6h-13A1.5 1.5 0 004 7.5v11A1.5 1.5 0 005.5 20zm2.5-8h3m2 0h3m-8 4h8" />
        </svg>
      ),
    },
    {
      title: "Pending Module Actions",
      value: overview.counters.pending_module_actions,
      href: localePath(params.locale, "/dashboard/provisioning"),
      glow: "rgba(34,211,238,0.18)",
      border: "rgba(34,211,238,0.25)",
      valueBg: "rgba(34,211,238,0.10)",
      valueColor: "#22d3ee",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />
        </svg>
      ),
    },
  ];

  const billingCards = [
    { label: "Today", value: overview.billing.today_minor, tone: "text-[#4caf50]" },
    { label: "This Month", value: overview.billing.this_month_minor, tone: "text-[#df9b39]" },
    { label: "This Year", value: overview.billing.this_year_minor, tone: "text-[#d94f8d]" },
    { label: "All Time", value: overview.billing.all_time_minor, tone: "text-[#111827]" },
  ];

  const operations = [
    {
      label: "Clients",
      value: summary.modules.clients.total ?? 0,
      href: localePath(params.locale, "/dashboard/clients"),
    },
    {
      label: "Services",
      value: summary.modules.services.total ?? 0,
      href: localePath(params.locale, "/dashboard/services"),
    },
    {
      label: "Active Services",
      value: summary.modules.services.active ?? 0,
      href: localePath(params.locale, "/dashboard/services?status=active"),
    },
    {
      label: "Overdue Invoices",
      value: summary.modules.invoices.overdue ?? 0,
      href: localePath(params.locale, "/dashboard/invoices?status=overdue"),
    },
  ];

  const healthTone =
    overview.system_health.rating === "good"
      ? "text-[#4ade80]"
      : overview.system_health.rating === "warning"
        ? "text-[#fb923c]"
        : "text-[#f87171]";
  const healthBar =
    overview.system_health.rating === "good"
      ? "bg-[#4ade80]"
      : overview.system_health.rating === "warning"
        ? "bg-[#fb923c]"
        : "bg-[#f87171]";
  const healthLabel =
    overview.system_health.rating === "good"
      ? "Good"
      : overview.system_health.rating === "warning"
        ? "Needs Review"
        : "Needs Attention";

  return (
    <DashboardShell
      actions={actions}
      currentPath="/dashboard"
      description="Operational view of orders, support, billing, and provisioning for the active tenant."
      locale={params.locale as AppLocale}
      title={t("overviewTitle")}
      tintedHeader={false}
    >
      <section className="grid gap-3 xl:grid-cols-4">
        {statTiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            style={{ borderColor: tile.border, boxShadow: `0 0 24px ${tile.glow}, inset 0 1px 0 rgba(255,255,255,0.04)` }}
            className="group relative overflow-hidden rounded-xl border bg-[#101827] p-5 transition-all duration-200 hover:scale-[1.02]"
          >
            {/* Subtle glow blob */}
            <div
              className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-50"
              style={{ background: tile.glow }}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">{tile.title}</p>
                <p className="mt-2.5 text-[2.25rem] font-bold leading-none tracking-[-0.04em]" style={{ color: tile.valueColor }}>
                  {tile.value}
                </p>
              </div>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: tile.valueBg, color: tile.valueColor }}
              >
                {tile.icon}
              </span>
            </div>
            {/* Bottom accent bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${tile.valueColor}88, transparent)` }} />
          </Link>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.92fr)]">
        <TenantSystemOverviewChart
          currency={overview.billing.currency}
          data={overview.chart}
          labels={{
            title: "System Overview",
            periods: {
              today: "Today",
              last_30_days: "Last 30 Days",
              last_year: "Last 1 Year",
            },
            newOrders: "New Orders",
            activatedOrders: "Activated Orders",
            income: "Income",
          }}
          locale={params.locale}
        />

        <div className="grid gap-5">
          <article className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#101827]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
            <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
              <h2 className="text-[15px] font-medium text-[#e5e7eb]">Billing</h2>
            </div>
            <div className="grid grid-cols-2">
              {billingCards.map((item, index) => (
                <div
                  key={item.label}
                  className={[
                    "px-5 py-4",
                    index < 2 ? "border-b border-[rgba(255,255,255,0.05)]" : "",
                    index % 2 === 0 ? "border-e border-[rgba(255,255,255,0.05)]" : "",
                  ].join(" ")}
                >
                  <p className={["text-[17px] font-semibold", item.tone].join(" ")}>
                    {formatMinorCurrency(item.value, overview.billing.currency, params.locale)}
                  </p>
                  <p className="mt-1 text-[13px] text-[#4b5563]">{item.label}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#101827]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
            <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
              <h2 className="text-[15px] font-medium text-[#e5e7eb]">Automation Overview</h2>
            </div>
            <div className="grid grid-cols-2">
              <div className="border-e border-[rgba(255,255,255,0.05)] px-5 py-6 text-center">
                <div className="mx-auto mb-4 h-8 w-28 border-b-2 border-[#22d3ee]">
                  <div className="mx-auto h-8 w-0 border-x-[18px] border-b-[28px] border-x-transparent border-b-[#22d3ee]" />
                </div>
                <p className="text-[13px] text-[#4b5563]">Invoices Created</p>
                <p className="mt-2 text-[32px] font-bold leading-none text-[#22d3ee]">
                  {overview.automation.invoices_created_today}
                </p>
              </div>
              <div className="px-5 py-6 text-center">
                <div className="mx-auto mb-4 h-8 w-28 border-b-2 border-[#f472b6]" />
                <p className="text-[13px] text-[#4b5563]">Credit Card Captures</p>
                <p className="mt-2 text-[32px] font-bold leading-none text-[#f472b6]">
                  {overview.automation.credit_card_captures_today}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {operations.map((item) => (
          <Link
            key={item.label}
            className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#101827] px-4 py-4 transition-all duration-150 hover:border-[rgba(59,130,246,0.3)] hover:bg-[#131f33]"
            href={item.href}
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4b5563]">{item.label}</p>
            <p className="mt-2 text-[28px] font-bold leading-none tracking-[-0.03em] text-[#f1f5fb]">{item.value}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#101827]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
            <h2 className="text-[15px] font-medium text-[#e5e7eb]">Support</h2>
            <Link className="text-[12px] text-[#3b82f6] hover:text-[#60a5fa]" href={localePath(params.locale, "/dashboard/tickets")}>
              View all tickets
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 px-5 py-5">
            <div>
              <p className="text-[13px] text-[#4b5563]">Awaiting Reply</p>
              <p className="mt-1 text-[30px] font-bold leading-none text-[#f1f5fb]">
                {overview.support.awaiting_reply}
              </p>
              <p className="mt-1 text-[13px] text-[#4b5563]">Tickets</p>
            </div>
            <div>
              <p className="text-[13px] text-[#4b5563]">Assigned To You</p>
              <p className="mt-1 text-[30px] font-bold leading-none text-[#f1f5fb]">
                {overview.support.assigned_to_you}
              </p>
              <p className="mt-1 text-[13px] text-[#4b5563]">Tickets</p>
            </div>
          </div>
          <div className="border-t border-[rgba(255,255,255,0.05)] px-5 py-3 text-[12px] text-[#374151]">
            Open tickets and assignments are based on the current tenant queue.
          </div>
        </article>

        <article className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#101827]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
            <h2 className="text-[15px] font-medium text-[#e5e7eb]">System Health</h2>
            <Link className="text-[12px] text-[#3b82f6] hover:text-[#60a5fa]" href={localePath(params.locale, "/dashboard/provisioning")}>
              View issues
            </Link>
          </div>
          <div className="px-5 py-5">
            <p className="text-[13px] text-[#4b5563]">Overall Rating</p>
            <p className={["mt-1 text-[30px] font-bold leading-none", healthTone].join(" ")}>
              {healthLabel}
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#1a2540]">
              <div
                className={[healthBar, "h-full rounded-full transition-all"].join(" ")}
                style={{ width: `${overview.system_health.score}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-[13px]">
              <div className="text-[#4b5563]">
                <span className="font-semibold text-[#e5e7eb]">{overview.system_health.warnings}</span> Warnings
              </div>
              <div className="text-[#4b5563]">
                <span className="font-semibold text-[#e5e7eb]">{overview.system_health.needs_attention}</span>{" "}
                Needing Attention
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="grid gap-5">
          <article className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#101827]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
            <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
              <h2 className="text-[15px] font-medium text-[#e5e7eb]">Client Activity</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 px-5 py-5">
              <div>
                <p className="text-[13px] text-[#4b5563]">Active Clients</p>
                <p className="mt-1 text-[30px] font-bold leading-none text-[#f1f5fb]">
                  {overview.client_activity.active_clients}
                </p>
              </div>
              <div>
                <p className="text-[13px] text-[#4b5563]">Users Online</p>
                <p className="mt-1 text-[30px] font-bold leading-none text-[#f1f5fb]">
                  {overview.client_activity.users_online_last_hour}
                </p>
                <p className="mt-1 text-[13px] text-[#4b5563]">Last hour</p>
              </div>
            </div>
            <div className="border-t border-[rgba(255,255,255,0.05)]">
              {overview.client_activity.recent_clients.length > 0 ? (
                overview.client_activity.recent_clients.map((client) => (
                  <div
                    key={client.id}
                    className="grid grid-cols-[minmax(0,1fr)_90px] gap-3 border-b border-[rgba(255,255,255,0.04)] px-5 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#e5e7eb]">{client.display_name}</p>
                      <p className="truncate text-[12px] text-[#4b5563]">{client.email}</p>
                    </div>
                    <div className="text-right text-[12px] uppercase tracking-[0.08em] text-[#374151]">
                      {client.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-5 text-sm text-[#374151]">No client activity yet.</div>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#101827]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
            <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
              <h2 className="text-[15px] font-medium text-[#e5e7eb]">Connected Servers</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b border-[rgba(255,255,255,0.04)] px-5 py-4 text-[13px]">
              <div>
                <p className="text-[#4b5563]">Configured</p>
                <p className="mt-1 text-[24px] font-bold leading-none text-[#f1f5fb]">
                  {overview.servers.connected_total}
                </p>
              </div>
              <div>
                <p className="text-[#4b5563]">Active</p>
                <p className="mt-1 text-[24px] font-bold leading-none text-[#4ade80]">
                  {overview.servers.active_total}
                </p>
              </div>
              <div>
                <p className="text-[#4b5563]">Needs Attention</p>
                <p className="mt-1 text-[24px] font-bold leading-none text-[#fb923c]">
                  {overview.servers.needs_attention_total}
                </p>
              </div>
            </div>
            <div>
              {overview.servers.items.length > 0 ? (
                overview.servers.items.map((server) => (
                  <div
                    key={server.id}
                    className="grid grid-cols-[minmax(0,1.2fr)_110px_120px] gap-3 border-b border-[rgba(255,255,255,0.04)] px-5 py-4 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#e5e7eb]">{server.name}</p>
                      <p className="truncate text-[12px] text-[#4b5563]">
                        {server.hostname} {server.ip_address ? `• ${server.ip_address}` : ""}
                      </p>
                    </div>
                    <div className="text-[12px] text-[#4b5563]">
                      <p className="uppercase tracking-[0.08em]">{server.status}</p>
                      <p className="mt-1">{server.panel_type}</p>
                    </div>
                    <div className="text-right text-[12px] text-[#4b5563]">
                      <p>
                        {server.current_accounts}
                        {server.max_accounts ? ` / ${server.max_accounts}` : ""} accounts
                      </p>
                      <p className="mt-1">Tested {formatRelativeTime(params.locale, server.last_tested_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-5 text-sm text-[#374151]">No servers connected yet.</div>
              )}
            </div>
          </article>
        </div>

        <div className="grid gap-5">
          <article className="rounded-[4px] border border-[#d9dee6] bg-white">
            <div className="border-b border-[#e5e7eb] px-4 py-3">
              <h2 className="text-[15px] font-medium text-[#1f2937]">Staff Online</h2>
            </div>
            <div className="px-5 py-5">
              {overview.staff_online.items.length > 0 ? (
                <div className="grid gap-4">
                  {overview.staff_online.items.map((staff) => (
                    <div key={staff.id} className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-semibold text-[#1d4ed8]">
                        {staff.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[#111827]">{staff.name}</p>
                        <p className="truncate text-[12px] text-[#6b7280]">
                          {formatRelativeTime(params.locale, staff.last_login_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[#6b7280]">No staff online in the last 15 minutes.</div>
              )}
            </div>
          </article>

          <article className="rounded-[4px] border border-[#d9dee6] bg-white">
            <div className="border-b border-[#e5e7eb] px-4 py-3">
              <h2 className="text-[15px] font-medium text-[#1f2937]">Activity</h2>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {overview.activity.length > 0 ? (
                overview.activity.map((item, index) => (
                  <div
                    key={`${item.type}-${item.occurred_at ?? index}-${index}`}
                    className="border-b border-[#eef2f7] px-5 py-4 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#111827]">{item.title}</p>
                        <p className="mt-1 text-[12px] leading-5 text-[#4b5563]">{item.message}</p>
                      </div>
                      <p className="shrink-0 text-[12px] text-[#6b7280]">
                        {formatRelativeTime(params.locale, item.occurred_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-5 text-sm text-[#6b7280]">No recent activity yet.</div>
              )}
            </div>
          </article>
        </div>
      </section>
    </DashboardShell>
  );
}
