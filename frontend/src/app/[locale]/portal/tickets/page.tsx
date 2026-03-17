import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchSupportOverviewFromCookies,
  fetchTicketsFromCookies,
  ticketPriorities,
  type TicketPriority,
} from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function PortalTicketsPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { search?: string; status_id?: string; priority?: string; page?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Support");
  const cookieHeader = cookies().toString();
  const [ticketsResponse, overview] = await Promise.all([
    fetchTicketsFromCookies(
      cookieHeader,
      {
        search: searchParams?.search,
        status_id: searchParams?.status_id,
        priority: searchParams?.priority,
        page: searchParams?.page,
      },
      "client",
    ),
    fetchSupportOverviewFromCookies(cookieHeader, "client"),
  ]);

  const tickets = ticketsResponse?.data ?? [];
  const statuses = overview?.statuses ?? [];
  const priorityLabels: Record<TicketPriority, string> = {
    low: t("priorityLow"),
    medium: t("priorityMedium"),
    high: t("priorityHigh"),
    urgent: t("priorityUrgent"),
  };

  return (
    <PortalShell
      actions={
        <Link
          href={localePath(params.locale, "/portal/tickets/new")}
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {t("newTicketButton")}
        </Link>
      }
      currentPath="/portal/tickets"
      description={t("listDescription")}
      locale={params.locale as AppLocale}
      title={t("listTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_260px_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("searchLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("searchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.status_id ?? ""}
              name="status_id"
            >
              <option value="">{t("allStatuses")}</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("priorityLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.priority ?? ""}
              name="priority"
            >
              <option value="">{t("allPriorities")}</option>
              {ticketPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabels[priority]}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              type="submit"
            >
              {t("searchButton")}
            </button>
            <Link
              className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
              href={localePath(params.locale, "/portal/tickets")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {tickets.length === 0 ? (
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("emptyStateTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("emptyStateDescription")}</p>
        </section>
      ) : (
        <section className="grid gap-4">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="glass-card p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">{ticket.subject}</h2>
                    <span className="rounded-full border border-line bg-[#faf9f5]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {ticket.ticket_number}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">{ticket.department?.name ?? t("notAvailable")}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full border border-line bg-accentSoft px-4 py-2 text-sm font-semibold text-foreground">
                    {ticket.status?.name ?? t("notAvailable")}
                  </span>
                  <Link
                    className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/portal/tickets/${ticket.id}`)}
                  >
                    {t("viewTicketButton")}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </PortalShell>
  );
}
