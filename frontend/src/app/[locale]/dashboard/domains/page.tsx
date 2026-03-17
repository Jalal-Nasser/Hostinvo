import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { domainStatuses, fetchDomainsFromCookies, type DomainStatus } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function DomainsPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { search?: string; status?: string; page?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");
  const domainsResponse = await fetchDomainsFromCookies(cookies().toString(), "admin", {
    search: searchParams?.search,
    status: searchParams?.status,
    page: searchParams?.page,
  });
  const domains = domainsResponse?.data ?? [];

  const statusLabels: Record<DomainStatus, string> = {
    active: t("statusActive"),
    expired: t("statusExpired"),
    pending_transfer: t("statusPendingTransfer"),
    pending_delete: t("statusPendingDelete"),
    cancelled: t("statusCancelled"),
  };

  return (
    <DashboardShell
      actions={
        <Link
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          href={localePath(params.locale, "/dashboard/domains/new")}
        >
          {t("newDomainButton")}
        </Link>
      }
      currentPath="/dashboard/domains"
      description={t("listDescription")}
      locale={params.locale as AppLocale}
      title={t("listTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_260px_auto] md:items-end">
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
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allStatuses")}</option>
              {domainStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
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
              href={localePath(params.locale, "/dashboard/domains")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {domains.length === 0 ? (
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("emptyStateTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("emptyStateDescription")}</p>
        </section>
      ) : (
        <section className="grid gap-4">
          {domains.map((domain) => (
            <article key={domain.id} className="glass-card p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">{domain.domain}</h2>
                    <span className="rounded-full border border-line bg-[#faf9f5]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {domain.tld}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">{domain.client?.display_name ?? t("notAvailable")}</p>
                  <p className="mt-2 text-sm text-muted">{domain.registrar ?? t("notAvailable")}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full border border-line bg-accentSoft px-4 py-2 text-sm font-semibold text-foreground">
                    {statusLabels[domain.status]}
                  </span>
                  <Link
                    className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/dashboard/domains/${domain.id}`)}
                  >
                    {t("viewDetailsButton")}
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("expiryDateLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {domain.expiry_date
                      ? new Intl.DateTimeFormat(params.locale, { dateStyle: "medium" }).format(new Date(domain.expiry_date))
                      : t("notAvailable")}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("renewalPriceLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {domain.renewal_price ?? t("notAvailable")}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("contactsSection")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{domain.contacts_count ?? 0}</p>
                </div>
                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("renewalHistoryTitle")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{domain.renewals_count ?? 0}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
