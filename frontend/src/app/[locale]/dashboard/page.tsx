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
  hasRole,
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
  const isPlatformOwner = hasRole(user, "super_admin");

  const actions = [
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
        className="btn-secondary whitespace-nowrap"
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
        }
      : null,
    summary.modules.invoices.accessible
      ? {
          key: "overdue-invoices",
          description: t("overdueInvoicesDescription"),
          label: t("overdueInvoicesLabel"),
          value: summary.modules.invoices.overdue ?? 0,
        }
      : null,
    summary.modules.tickets.accessible
      ? {
          key: "urgent-tickets",
          description: t("urgentTicketsDescription"),
          label: t("urgentTicketsLabel"),
          value: summary.modules.tickets.urgent ?? 0,
        }
      : null,
    summary.modules.provisioning.accessible
      ? {
          key: "failed-jobs",
          description: t("failedJobsDescription"),
          label: t("failedJobsLabel"),
          value: summary.modules.provisioning.failed ?? 0,
        }
      : null,
  ].filter((metric): metric is NonNullable<typeof metric> => metric !== null);

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
            <div
              key={stat.key}
              className="dashboard-header-stat min-w-0"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6a7fa0]">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#0a1628]">
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
      <RevenueActivityChart
        activityLabel={t("activitySeriesLabel")}
        data={revenueActivityData}
        description={t("revenueActivityDescription")}
        locale={params.locale}
        revenueLabel={t("revenueSeriesLabel")}
        title={t("revenueActivityTitle")}
      />

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <article className="glass-card p-6 md:p-8">
          <p className="dashboard-kicker">{t("operationsTitle")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
            {t("operationsTitle")}
          </h2>
          {operationalMetrics.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {operationalMetrics.map((metric) => (
                <div
                  key={metric.key}
                  className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] p-5"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8794]">
                    {metric.label}
                  </p>
                  <p className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[#0a1628]">
                    {metric.value}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#6b7280]">{metric.description}</p>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <aside className="glass-card p-6 md:p-8">
          <p className="dashboard-kicker">{t("workspaceAccessTitle")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
            {t("workspaceAccessTitle")}
          </h2>
          <div className="mt-6 grid gap-4">
            <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8794]">{t("tenantLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-[#0a1628]">
                {user.tenant?.name ?? t("notAvailable")}
              </p>
              <p className="mt-2 text-sm text-[#6b7280]">{user.tenant?.slug ?? user.tenant_id ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8794]">{t("rolesLabel")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role.id}
                    className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0a1628]"
                  >
                    {role.display_name}
                  </span>
                ))}
              </div>
            </div>
            {canAccessClientPortal(user) ? (
              <Link
                className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-5 transition hover:bg-[#dbeafe]"
                href={localePath(params.locale, "/portal")}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8794]">
                  {workspaceT("portalBadge")}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#0a1628]">
                  {workspaceT("switchToPortal")}
                </p>
              </Link>
            ) : null}
          </div>
        </aside>
      </section>

      {showRecentInvoices || showRecentTickets ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {showRecentInvoices ? (
            <article className="glass-card p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="dashboard-kicker">{t("recentInvoicesTitle")}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">{t("recentInvoicesTitle")}</h2>
                </div>
                <Link
                  className="btn-ghost"
                  href={localePath(params.locale, "/dashboard/invoices")}
                >
                  {t("viewAllLink")}
                </Link>
              </div>
              <div className="mt-6 grid gap-4">
                {summary.modules.invoices.recent.map((invoice) => (
                  <Link
                    key={invoice.id}
                    className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] p-5 transition hover:bg-white"
                    href={localePath(params.locale, `/dashboard/invoices/${invoice.id}`)}
                  >
                    <p className="text-sm font-semibold text-[#0a1628]">{invoice.reference_number}</p>
                    <p className="mt-2 text-sm text-[#6b7280]">
                      {invoice.client?.display_name ?? t("notAvailable")} / {invoice.status}
                    </p>
                  </Link>
                ))}
              </div>
            </article>
          ) : null}

          {showRecentTickets ? (
            <article className="glass-card p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="dashboard-kicker">{t("recentTicketsTitle")}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">{t("recentTicketsTitle")}</h2>
                </div>
                <Link
                  className="btn-ghost"
                  href={localePath(params.locale, "/dashboard/tickets")}
                >
                  {t("viewAllLink")}
                </Link>
              </div>
              <div className="mt-6 grid gap-4">
                {summary.modules.tickets.recent.slice(0, 4).map((ticket) => (
                  <Link
                    key={ticket.id}
                    className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] p-5 transition hover:bg-white"
                    href={localePath(params.locale, `/dashboard/tickets/${ticket.id}`)}
                  >
                    <p className="text-sm font-semibold text-[#0a1628]">{ticket.subject}</p>
                    <p className="mt-2 text-sm text-[#6b7280]">
                      {ticket.ticket_number} / {ticket.status?.name ?? t("notAvailable")}
                    </p>
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
