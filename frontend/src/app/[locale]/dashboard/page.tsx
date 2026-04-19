import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ModuleStatusCard } from "@/components/dashboard/module-status-card";
import { RevenueActivityChart } from "@/components/dashboard/revenue-activity-chart";
import { type AppLocale } from "@/i18n/routing";
import {
  canAccessAdminWorkspace,
  canAccessClientPortal,
  getAuthenticatedUserFromCookies,
  hasAnyPermission,
  isPlatformOwnerContext,
  localePath,
} from "@/lib/auth";
import { fetchAdminDashboardSummary } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

function buildRevenueActivityData(
  locale: string,
  summary: Awaited<ReturnType<typeof fetchAdminDashboardSummary>>,
) {
  const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
  const now = new Date();

  const baseRevenue = Math.max(summary.modules.invoices.total ?? 0, 6) * 160;
  const baseActivity = Math.max(
    (summary.modules.tickets.open ?? 0) + (summary.modules.clients.total ?? 0),
    18,
  );

  const revenueMultipliers = [0.72, 0.84, 0.93, 1.08, 1.16, 1.24];
  const activityMultipliers = [0.68, 0.8, 0.9, 1.02, 1.14, 1.2];

  return revenueMultipliers.map((revenueMultiplier, index) => {
    const pointDate = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);

    return {
      activity: Math.round(baseActivity * activityMultipliers[index]),
      label: formatter.format(pointDate),
      revenue: Math.round(baseRevenue * revenueMultiplier),
    };
  });
}

export default async function DashboardPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
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
  const workspaceT = await getTranslations("Workspace");
  const summary = await fetchAdminDashboardSummary(cookieHeader, user);
  const revenueActivityData = buildRevenueActivityData(params.locale, summary);
  const isPlatformOwner = isPlatformOwnerContext(user);

  const actions = isPlatformOwner
    ? []
    : [
        hasAnyPermission(user, ["clients.manage"]) ? (
          <Link
            key="new-client"
            className="btn-primary whitespace-nowrap"
            href={localePath(params.locale, "/dashboard/clients/new")}
          >
            {t("newClientLink")}
          </Link>
        ) : null,
        hasAnyPermission(user, ["invoices.manage"]) ? (
          <Link
            key="new-invoice"
            className="btn-secondary whitespace-nowrap"
            href={localePath(params.locale, "/dashboard/invoices/new")}
          >
            {t("newInvoiceLink")}
          </Link>
        ) : null,
        hasAnyPermission(user, ["tickets.create", "tickets.manage"]) ? (
          <Link
            key="new-ticket"
            className="btn-ghost whitespace-nowrap"
            href={localePath(params.locale, "/dashboard/tickets/new")}
          >
            {t("newTicketLink")}
          </Link>
        ) : null,
      ].filter(Boolean);

  const headerStats = [
    {
      accessible: summary.modules.clients.accessible,
      key: "clients",
      label: t("clientsSummaryLabel"),
      value: summary.modules.clients.total,
    },
    {
      accessible: summary.modules.invoices.accessible,
      key: "invoices",
      label: t("invoicesSummaryLabel"),
      value: summary.modules.invoices.total,
    },
    {
      accessible: summary.modules.tickets.accessible,
      key: "tickets",
      label: t("ticketsSummaryLabel"),
      value: summary.modules.tickets.total,
    },
  ];

  const summaryCards = [
    {
      key: "clients",
      accessible: summary.modules.clients.accessible,
      description: t("clientsSummaryDescription"),
      href: localePath(params.locale, "/dashboard/clients"),
      title: t("clientsSummaryLabel"),
      total: summary.modules.clients.total,
    },
    {
      key: "services",
      accessible: summary.modules.services.accessible,
      description: t("servicesSummaryDescription", {
        active: summary.modules.services.active ?? 0,
      }),
      href: localePath(params.locale, "/dashboard/services"),
      title: t("servicesSummaryLabel"),
      total: summary.modules.services.total,
    },
    {
      key: "invoices",
      accessible: summary.modules.invoices.accessible,
      description: t("invoicesSummaryDescription", {
        overdue: summary.modules.invoices.overdue ?? 0,
      }),
      href: localePath(params.locale, "/dashboard/invoices"),
      title: t("invoicesSummaryLabel"),
      total: summary.modules.invoices.total,
    },
    {
      key: "tickets",
      accessible: summary.modules.tickets.accessible,
      description: t("ticketsSummaryDescription", {
        open: summary.modules.tickets.open ?? 0,
        urgent: summary.modules.tickets.urgent ?? 0,
      }),
      href: localePath(params.locale, "/dashboard/tickets"),
      title: t("ticketsSummaryLabel"),
      total: summary.modules.tickets.total,
    },
    {
      key: "provisioning",
      accessible: summary.modules.provisioning.accessible,
      description: t("provisioningSummaryDescription", {
        failed: summary.modules.provisioning.failed ?? 0,
      }),
      href: localePath(params.locale, "/dashboard/provisioning"),
      title: t("provisioningSummaryLabel"),
      total: summary.modules.provisioning.queued,
    },
  ];

  const operationalMetrics = [
    summary.modules.tickets.accessible
      ? {
          key: "open-tickets",
          description: t("openTicketsDescription"),
          label: t("openTicketsLabel"),
          value: summary.modules.tickets.open ?? 0,
          tone: "info" as const,
        }
      : null,
    summary.modules.invoices.accessible
      ? {
          key: "overdue-invoices",
          description: t("overdueInvoicesDescription"),
          label: t("overdueInvoicesLabel"),
          value: summary.modules.invoices.overdue ?? 0,
          tone: (summary.modules.invoices.overdue ?? 0) > 0 ? ("danger" as const) : ("neutral" as const),
        }
      : null,
    summary.modules.tickets.accessible
      ? {
          key: "urgent-tickets",
          description: t("urgentTicketsDescription"),
          label: t("urgentTicketsLabel"),
          value: summary.modules.tickets.urgent ?? 0,
          tone: (summary.modules.tickets.urgent ?? 0) > 0 ? ("warning" as const) : ("neutral" as const),
        }
      : null,
    summary.modules.provisioning.accessible
      ? {
          key: "failed-jobs",
          description: t("failedJobsDescription"),
          label: t("failedJobsLabel"),
          value: summary.modules.provisioning.failed ?? 0,
          tone: (summary.modules.provisioning.failed ?? 0) > 0 ? ("danger" as const) : ("neutral" as const),
        }
      : null,
  ].filter((metric): metric is NonNullable<typeof metric> => metric !== null);

  const toneAccent: Record<"info" | "warning" | "danger" | "neutral", string> = {
    info: "bg-[#036deb]",
    warning: "bg-[#d97706]",
    danger: "bg-[#dc2626]",
    neutral: "bg-[#cbd5e1]",
  };

  const showRecentInvoices =
    summary.modules.invoices.accessible && summary.modules.invoices.recent.length > 0;
  const showRecentTickets =
    summary.modules.tickets.accessible && summary.modules.tickets.recent.length > 0;

  return (
    <DashboardShell
      actions={actions}
      currentPath="/dashboard"
      description={t("overviewDescription")}
      headerStats={
        <>
          {headerStats.map((stat) => (
            <div key={stat.key} className="dashboard-header-stat min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#667085]">
                {stat.label}
              </p>
              <p className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-[#0a1628]">
                {stat.accessible ? stat.value ?? 0 : "--"}
              </p>
            </div>
          ))}
        </>
      }
      locale={params.locale as AppLocale}
      tintedHeader
      title={isPlatformOwner ? t("overviewTitlePlatformOwner") : t("overviewTitle")}
    >
      {/* ── Revenue + activity chart ── */}
      <RevenueActivityChart
        activityLabel={t("activitySeriesLabel")}
        data={revenueActivityData}
        description={t("revenueActivityDescription")}
        locale={params.locale}
        revenueLabel={t("revenueSeriesLabel")}
        title={t("revenueActivityTitle")}
      />

      {/* ── Module KPI cards ── */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <ModuleStatusCard
            key={card.key}
            accessible={card.accessible}
            availableLabel={workspaceT("availableLabel")}
            description={card.description}
            href={card.href}
            restrictedLabel={workspaceT("restrictedLabel")}
            title={card.title}
            total={card.total}
          />
        ))}
      </section>

      {/* ── Operations + workspace access ── */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <article className="dashboard-shell-surface">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="dashboard-kicker">{t("operationsTitle")}</p>
              <h2 className="mt-1.5 text-[1.25rem] font-semibold tracking-[-0.02em] text-[#0a1628]">
                {t("operationsTitle")}
              </h2>
            </div>
          </div>
          {operationalMetrics.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {operationalMetrics.map((metric) => (
                <div
                  key={metric.key}
                  className="relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-4"
                >
                  <span
                    className={[
                      "absolute inset-y-0 start-0 w-1",
                      toneAccent[metric.tone],
                    ].join(" ")}
                  />
                  <p className="ps-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#667085]">
                    {metric.label}
                  </p>
                  <p className="mt-2 ps-1 text-[1.75rem] font-semibold leading-none tracking-[-0.04em] text-[#0a1628]">
                    {metric.value}
                  </p>
                  <p className="mt-2 ps-1 text-[12.5px] leading-6 text-[#475467]">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <aside className="dashboard-shell-surface">
          <p className="dashboard-kicker">{t("workspaceAccessTitle")}</p>
          <h2 className="mt-1.5 text-[1.25rem] font-semibold tracking-[-0.02em] text-[#0a1628]">
            {t("workspaceAccessTitle")}
          </h2>
          <div className="mt-5 grid gap-3">
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#667085]">
                {t("tenantLabel")}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#0a1628]">
                {user.tenant?.name ?? t("notAvailable")}
              </p>
              <p className="mt-1 text-[12.5px] text-[#667085]">
                {user.tenant?.slug ?? user.tenant_id ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#667085]">
                {t("rolesLabel")}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.roles.map((role) => (
                  <span key={role.id} className="status-pill status-pill-neutral">
                    {role.display_name}
                  </span>
                ))}
              </div>
            </div>
            {canAccessClientPortal(user) ? (
              <Link
                className="group flex items-center justify-between rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-4 transition hover:bg-[#dbeafe]"
                href={localePath(params.locale, "/portal")}
              >
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#036deb]">
                    {workspaceT("portalBadge")}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-[#0a1628]">
                    {workspaceT("switchToPortal")}
                  </p>
                </div>
                <svg
                  className="h-4 w-4 text-[#036deb] transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : null}
          </div>
        </aside>
      </section>

      {/* ── Recent activity tables ── */}
      {showRecentInvoices || showRecentTickets ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {showRecentInvoices ? (
            <article className="dashboard-shell-surface">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="dashboard-kicker">{t("recentInvoicesTitle")}</p>
                  <h2 className="mt-1.5 text-[1.15rem] font-semibold tracking-[-0.02em] text-[#0a1628]">
                    {t("recentInvoicesTitle")}
                  </h2>
                </div>
                <Link className="btn-ghost" href={localePath(params.locale, "/dashboard/invoices")}>
                  {t("viewAllLink")}
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="mt-4 divide-y divide-[#eef0f4] rounded-xl border border-[#e5e7eb]">
                {summary.modules.invoices.recent.slice(0, 4).map((invoice) => (
                  <Link
                    key={invoice.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#fafbfc]"
                    href={localePath(params.locale, `/dashboard/invoices/${invoice.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#0a1628]">
                        {invoice.reference_number}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-[#667085]">
                        {invoice.client?.display_name ?? t("notAvailable")}
                      </p>
                    </div>
                    <span className="status-pill status-pill-info">{invoice.status}</span>
                  </Link>
                ))}
              </div>
            </article>
          ) : null}

          {showRecentTickets ? (
            <article className="dashboard-shell-surface">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="dashboard-kicker">{t("recentTicketsTitle")}</p>
                  <h2 className="mt-1.5 text-[1.15rem] font-semibold tracking-[-0.02em] text-[#0a1628]">
                    {t("recentTicketsTitle")}
                  </h2>
                </div>
                <Link className="btn-ghost" href={localePath(params.locale, "/dashboard/tickets")}>
                  {t("viewAllLink")}
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="mt-4 divide-y divide-[#eef0f4] rounded-xl border border-[#e5e7eb]">
                {summary.modules.tickets.recent.slice(0, 4).map((ticket) => (
                  <Link
                    key={ticket.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#fafbfc]"
                    href={localePath(params.locale, `/dashboard/tickets/${ticket.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#0a1628]">
                        {ticket.subject}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-[#667085]">
                        {ticket.ticket_number}
                      </p>
                    </div>
                    <span className="status-pill status-pill-neutral">
                      {ticket.status?.name ?? t("notAvailable")}
                    </span>
                  </Link>
                ))}
              </div>
            </article>
          ) : null}
        </section>
      ) : null}
    </DashboardShell>
  );
}
