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
    </DashboardShell>
  );
}
