import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchSupportOverviewFromCookies } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function SupportOverviewPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Support");
  const overview = await fetchSupportOverviewFromCookies(cookies().toString());

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href={localePath(params.locale, "/dashboard/tickets")}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            {t("ticketsListButton")}
          </Link>
          <Link
            href={localePath(params.locale, "/dashboard/tickets/new")}
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          >
            {t("newTicketButton")}
          </Link>
        </div>
      }
      currentPath="/dashboard/support"
      description={t("adminViewDescription")}
      locale={params.locale as AppLocale}
      title={t("adminViewTitle")}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statTotal")}</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{overview?.stats.total ?? 0}</p>
        </article>
        <article className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statOpen")}</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{overview?.stats.open ?? 0}</p>
        </article>
        <article className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statClosed")}</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{overview?.stats.closed ?? 0}</p>
        </article>
        <article className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statUrgent")}</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{overview?.stats.urgent ?? 0}</p>
        </article>
        <article className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statUnassigned")}</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{overview?.stats.unassigned ?? 0}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("departmentsSection")}</h2>
          {(overview?.departments.length ?? 0) > 0 ? (
            <div className="mt-6 grid gap-4">
              {overview?.departments.map((department) => (
                <div key={department.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{department.name}</p>
                    <p className="text-sm text-muted">{department.tickets_count ?? 0}</p>
                  </div>
                  <p className="mt-3 text-sm text-muted">{department.description ?? t("notAvailable")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("noDepartments")}</p>
          )}
        </article>

        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("statusesSection")}</h2>
          {(overview?.statuses.length ?? 0) > 0 ? (
            <div className="mt-6 grid gap-4">
              {overview?.statuses.map((status) => (
                <div key={status.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{status.name}</p>
                    <p className="text-sm text-muted">{status.tickets_count ?? 0}</p>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {status.is_closed ? t("statusCategoryClosed") : t("statusCategoryOpen")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("noStatuses")}</p>
          )}
        </article>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("recentTicketsSection")}</h2>
        {(overview?.recent_tickets.length ?? 0) > 0 ? (
          <div className="mt-6 grid gap-4">
            {overview?.recent_tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{ticket.subject}</p>
                    <p className="mt-2 text-sm text-muted">
                      {ticket.ticket_number} / {ticket.client?.display_name ?? t("notAvailable")}
                    </p>
                  </div>
                  <Link
                    className="rounded-full border border-line bg-[#faf9f5] px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/dashboard/tickets/${ticket.id}`)}
                  >
                    {t("viewTicketButton")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">{t("emptyStateDescription")}</p>
        )}
      </section>
    </DashboardShell>
  );
}
