import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { Button } from "@/components/ui/button";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { domainStatuses, fetchDomainsFromCookies, type DomainStatus } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function PortalDomainsPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { search?: string; status?: string; page?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");
  const isArabic = params.locale === "ar";
  const registerDomainHref = localePath(params.locale, "/portal/domains/register");
  const transferDomainHref = localePath(params.locale, "/portal/domains/transfer");
  const domainsResponse = await fetchDomainsFromCookies(cookies().toString(), "client", {
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
    <PortalShell
      actions={
        <Button asChild>
          <Link href={registerDomainHref}>{t("registerDomainCta")}</Link>
        </Button>
      }
      currentPath="/portal/domains"
      description={t("portalListDescription")}
      locale={params.locale as AppLocale}
      title={t("portalListTitle")}
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
              href={localePath(params.locale, "/portal/domains")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {domains.length === 0 ? (
        <section className="glass-card p-8 md:p-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2 className="text-2xl font-semibold text-foreground">{t("emptyStateTitle")}</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              {t("portalEmptyStateDescription")}
            </p>
            <div
              className={[
                "ms-auto me-auto mt-6 flex flex-wrap items-center justify-center gap-3",
                isArabic ? "flex-row-reverse" : "",
              ].join(" ")}
            >
              <Button asChild>
                <Link href={registerDomainHref}>{t("registerDomainButton")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={transferDomainHref}>{t("transferDomainButton")}</Link>
              </Button>
            </div>
          </div>
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
                  <p className="mt-3 text-sm text-muted">{domain.registrar ?? t("notAvailable")}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full border border-line bg-accentSoft px-4 py-2 text-sm font-semibold text-foreground">
                    {statusLabels[domain.status]}
                  </span>
                  <Link
                    className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/portal/domains/${domain.id}`)}
                  >
                    {t("viewDetailsButton")}
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
