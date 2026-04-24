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
      accent: "bg-[#55b84f]",
      tone: "bg-[#68c75f]",
    },
    {
      title: "Tickets Waiting",
      value: overview.counters.tickets_waiting,
      href: localePath(params.locale, "/dashboard/tickets"),
      accent: "bg-[#cf1e6e]",
      tone: "bg-[#e04890]",
    },
    {
      title: "Pending Cancellations",
      value: overview.counters.pending_cancellations,
      href: localePath(params.locale, "/dashboard/services"),
      accent: "bg-[#d68c10]",
      tone: "bg-[#efb24f]",
    },
    {
      title: "Pending Module Actions",
      value: overview.counters.pending_module_actions,
      href: localePath(params.locale, "/dashboard/provisioning"),
      accent: "bg-[#72b7bd]",
      tone: "bg-[#8bcbd0]",
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
      ? "text-[#5cb85c]"
      : overview.system_health.rating === "warning"
        ? "text-[#d68c10]"
        : "text-[#dc2626]";
  const healthBar =
    overview.system_health.rating === "good"
      ? "bg-[#7ecf72]"
      : overview.system_health.rating === "warning"
        ? "bg-[#efb24f]"
        : "bg-[#ef8c8c]";
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
            className={[
              "grid min-h-[96px] grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-[4px] text-white",
              tile.tone,
            ].join(" ")}
            href={tile.href}
          >
            <div className={[tile.accent, "flex items-center justify-center text-[32px] font-semibold"].join(" ")}>
              {tile.value}
            </div>
            <div className="flex flex-col justify-center px-5 py-4">
              <p className="text-[13px] font-medium text-white/95">{tile.title}</p>
            </div>
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
          <article className="rounded-[4px] border border-[#d9dee6] bg-white">
            <div className="border-b border-[#e5e7eb] px-4 py-3">
              <h2 className="text-[15px] font-medium text-[#1f2937]">Billing</h2>
            </div>
            <div className="grid grid-cols-2">
              {billingCards.map((item, index) => (
                <div
                  key={item.label}
                  className={[
                    "px-5 py-4",
                    index < 2 ? "border-b border-[#e5e7eb]" : "",
                    index % 2 === 0 ? "border-e border-[#e5e7eb]" : "",
                  ].join(" ")}
                >
                  <p className={["text-[17px] font-medium", item.tone].join(" ")}>
                    {formatMinorCurrency(item.value, overview.billing.currency, params.locale)}
                  </p>
                  <p className="mt-1 text-[13px] text-[#6b7280]">{item.label}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[4px] border border-[#d9dee6] bg-white">
            <div className="border-b border-[#e5e7eb] px-4 py-3">
              <h2 className="text-[15px] font-medium text-[#1f2937]">Automation Overview</h2>
            </div>
            <div className="grid grid-cols-2">
              <div className="border-e border-[#e5e7eb] px-5 py-6 text-center">
                <div className="mx-auto mb-4 h-8 w-28 border-b-2 border-[#82dbe2]">
                  <div className="mx-auto h-8 w-0 border-x-[18px] border-b-[28px] border-x-transparent border-b-[#82dbe2]" />
                </div>
                <p className="text-[13px] text-[#6b7280]">Invoices Created</p>
                <p className="mt-2 text-[32px] font-medium leading-none text-[#76cad3]">
                  {overview.automation.invoices_created_today}
                </p>
              </div>
              <div className="px-5 py-6 text-center">
                <div className="mx-auto mb-4 h-8 w-28 border-b-2 border-[#f1b7d0]" />
                <p className="text-[13px] text-[#6b7280]">Credit Card Captures</p>
                <p className="mt-2 text-[32px] font-medium leading-none text-[#f08fb8]">
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
            className="rounded-[4px] border border-[#d9dee6] bg-white px-4 py-4 transition hover:border-[#c7d2e1]"
            href={item.href}
          >
            <p className="text-[12px] uppercase tracking-[0.12em] text-[#6b7280]">{item.label}</p>
            <p className="mt-2 text-[28px] font-semibold leading-none text-[#111827]">{item.value}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[4px] border border-[#d9dee6] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
            <h2 className="text-[15px] font-medium text-[#1f2937]">Support</h2>
            <Link className="text-[12px] text-[#036deb]" href={localePath(params.locale, "/dashboard/tickets")}>
              View all tickets
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 px-5 py-5">
            <div>
              <p className="text-[13px] text-[#6b7280]">Awaiting Reply</p>
              <p className="mt-1 text-[30px] font-medium leading-none text-[#111827]">
                {overview.support.awaiting_reply}
              </p>
              <p className="mt-1 text-[13px] text-[#6b7280]">Tickets</p>
            </div>
            <div>
              <p className="text-[13px] text-[#6b7280]">Assigned To You</p>
              <p className="mt-1 text-[30px] font-medium leading-none text-[#111827]">
                {overview.support.assigned_to_you}
              </p>
              <p className="mt-1 text-[13px] text-[#6b7280]">Tickets</p>
            </div>
          </div>
          <div className="border-t border-[#e5e7eb] px-5 py-3 text-[12px] text-[#4b5563]">
            Open tickets and assignments are based on the current tenant queue.
          </div>
        </article>

        <article className="rounded-[4px] border border-[#d9dee6] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
            <h2 className="text-[15px] font-medium text-[#1f2937]">System Health</h2>
            <Link className="text-[12px] text-[#036deb]" href={localePath(params.locale, "/dashboard/provisioning")}>
              View issues
            </Link>
          </div>
          <div className="px-5 py-5">
            <p className="text-[13px] text-[#6b7280]">Overall Rating</p>
            <p className={["mt-1 text-[30px] font-medium leading-none", healthTone].join(" ")}>
              {healthLabel}
            </p>
            <div className="mt-4 h-4 overflow-hidden rounded-[3px] bg-[#edf2f7]">
              <div
                className={[healthBar, "h-full transition-all"].join(" ")}
                style={{ width: `${overview.system_health.score}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-[13px]">
              <div className="text-[#6b7280]">
                <span className="font-medium text-[#111827]">{overview.system_health.warnings}</span> Warnings
              </div>
              <div className="text-[#6b7280]">
                <span className="font-medium text-[#111827]">{overview.system_health.needs_attention}</span>{" "}
                Needing Attention
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="grid gap-5">
          <article className="rounded-[4px] border border-[#d9dee6] bg-white">
            <div className="border-b border-[#e5e7eb] px-4 py-3">
              <h2 className="text-[15px] font-medium text-[#1f2937]">Client Activity</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 px-5 py-5">
              <div>
                <p className="text-[13px] text-[#6b7280]">Active Clients</p>
                <p className="mt-1 text-[30px] font-medium leading-none text-[#111827]">
                  {overview.client_activity.active_clients}
                </p>
              </div>
              <div>
                <p className="text-[13px] text-[#6b7280]">Users Online</p>
                <p className="mt-1 text-[30px] font-medium leading-none text-[#111827]">
                  {overview.client_activity.users_online_last_hour}
                </p>
                <p className="mt-1 text-[13px] text-[#6b7280]">Last hour</p>
              </div>
            </div>
            <div className="border-t border-[#e5e7eb]">
              {overview.client_activity.recent_clients.length > 0 ? (
                overview.client_activity.recent_clients.map((client) => (
                  <div
                    key={client.id}
                    className="grid grid-cols-[minmax(0,1fr)_90px] gap-3 border-b border-[#eef2f7] px-5 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#111827]">{client.display_name}</p>
                      <p className="truncate text-[12px] text-[#6b7280]">{client.email}</p>
                    </div>
                    <div className="text-right text-[12px] uppercase tracking-[0.08em] text-[#6b7280]">
                      {client.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-5 text-sm text-[#6b7280]">No client activity yet.</div>
              )}
            </div>
          </article>

          <article className="rounded-[4px] border border-[#d9dee6] bg-white">
            <div className="border-b border-[#e5e7eb] px-4 py-3">
              <h2 className="text-[15px] font-medium text-[#1f2937]">Connected Servers</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b border-[#eef2f7] px-5 py-4 text-[13px]">
              <div>
                <p className="text-[#6b7280]">Configured</p>
                <p className="mt-1 text-[24px] font-medium leading-none text-[#111827]">
                  {overview.servers.connected_total}
                </p>
              </div>
              <div>
                <p className="text-[#6b7280]">Active</p>
                <p className="mt-1 text-[24px] font-medium leading-none text-[#111827]">
                  {overview.servers.active_total}
                </p>
              </div>
              <div>
                <p className="text-[#6b7280]">Needs Attention</p>
                <p className="mt-1 text-[24px] font-medium leading-none text-[#111827]">
                  {overview.servers.needs_attention_total}
                </p>
              </div>
            </div>
            <div>
              {overview.servers.items.length > 0 ? (
                overview.servers.items.map((server) => (
                  <div
                    key={server.id}
                    className="grid grid-cols-[minmax(0,1.2fr)_110px_120px] gap-3 border-b border-[#eef2f7] px-5 py-4 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#111827]">{server.name}</p>
                      <p className="truncate text-[12px] text-[#6b7280]">
                        {server.hostname} {server.ip_address ? `• ${server.ip_address}` : ""}
                      </p>
                    </div>
                    <div className="text-[12px] text-[#6b7280]">
                      <p className="uppercase tracking-[0.08em]">{server.status}</p>
                      <p className="mt-1">{server.panel_type}</p>
                    </div>
                    <div className="text-right text-[12px] text-[#6b7280]">
                      <p>
                        {server.current_accounts}
                        {server.max_accounts ? ` / ${server.max_accounts}` : ""} accounts
                      </p>
                      <p className="mt-1">Tested {formatRelativeTime(params.locale, server.last_tested_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-5 text-sm text-[#6b7280]">No servers connected yet.</div>
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
