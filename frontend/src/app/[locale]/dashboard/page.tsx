import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ModuleStatusCard } from "@/components/dashboard/module-status-card";
import { type AppLocale } from "@/i18n/routing";
import {
  canAccessAdminWorkspace,
  canAccessClientPortal,
  getAuthenticatedUserFromCookies,
  hasAnyPermission,
  localePath,
} from "@/lib/auth";
import { fetchAdminDashboardSummary } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

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

  const actions = [
    hasAnyPermission(user, ["clients.manage"]) ? (
      <Link
        key="new-client"
        className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        href={localePath(params.locale, "/dashboard/clients/new")}
      >
        {t("newClientLink")}
      </Link>
    ) : null,
    hasAnyPermission(user, ["invoices.manage"]) ? (
      <Link
        key="new-invoice"
        className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
        href={localePath(params.locale, "/dashboard/invoices/new")}
      >
        {t("newInvoiceLink")}
      </Link>
    ) : null,
    hasAnyPermission(user, ["tickets.create", "tickets.manage"]) ? (
      <Link
        key="new-ticket"
        className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
        href={localePath(params.locale, "/dashboard/tickets/new")}
      >
        {t("newTicketLink")}
      </Link>
    ) : null,
  ].filter(Boolean);

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
      locale={params.locale as AppLocale}
      title={t("overviewTitle")}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("operationsTitle")}</h2>
          {operationalMetrics.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {operationalMetrics.map((metric) => (
                <div
                  key={metric.key}
                  className="rounded-[1.5rem] border border-line bg-white/80 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{metric.value}</p>
                  <p className="mt-3 text-sm leading-7 text-muted">{metric.description}</p>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <aside className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("workspaceAccessTitle")}</h2>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("tenantLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {user.tenant?.name ?? t("notAvailable")}
              </p>
              <p className="mt-2 text-sm text-muted">{user.tenant?.slug ?? user.tenant_id ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("rolesLabel")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role.id}
                    className="rounded-full border border-line bg-[#fffdf8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground"
                  >
                    {role.display_name}
                  </span>
                ))}
              </div>
            </div>
            {canAccessClientPortal(user) ? (
              <Link
                className="rounded-[1.5rem] border border-line bg-[#fffdf8] p-5 transition hover:bg-white"
                href={localePath(params.locale, "/portal")}
              >
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  {workspaceT("portalBadge")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {workspaceT("switchToPortal")}
                </p>
              </Link>
            ) : null}
          </div>
        </aside>
      </section>

      {showRecentInvoices || showRecentTickets ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {showRecentInvoices ? (
            <article className="glass-card p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-foreground">{t("recentInvoicesTitle")}</h2>
                <Link
                  className="text-sm font-semibold text-accent transition hover:opacity-80"
                  href={localePath(params.locale, "/dashboard/invoices")}
                >
                  {t("viewAllLink")}
                </Link>
              </div>
              <div className="mt-6 grid gap-4">
                {summary.modules.invoices.recent.map((invoice) => (
                  <Link
                    key={invoice.id}
                    className="rounded-[1.5rem] border border-line bg-white/80 p-5 transition hover:bg-[#fffdf8]"
                    href={localePath(params.locale, `/dashboard/invoices/${invoice.id}`)}
                  >
                    <p className="text-sm font-semibold text-foreground">{invoice.reference_number}</p>
                    <p className="mt-2 text-sm text-muted">
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
                <h2 className="text-2xl font-semibold text-foreground">{t("recentTicketsTitle")}</h2>
                <Link
                  className="text-sm font-semibold text-accent transition hover:opacity-80"
                  href={localePath(params.locale, "/dashboard/tickets")}
                >
                  {t("viewAllLink")}
                </Link>
              </div>
              <div className="mt-6 grid gap-4">
                {summary.modules.tickets.recent.slice(0, 4).map((ticket) => (
                  <Link
                    key={ticket.id}
                    className="rounded-[1.5rem] border border-line bg-white/80 p-5 transition hover:bg-[#fffdf8]"
                    href={localePath(params.locale, `/dashboard/tickets/${ticket.id}`)}
                  >
                    <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
                    <p className="mt-2 text-sm text-muted">
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
