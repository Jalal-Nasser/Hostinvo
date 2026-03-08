import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchDomainFromCookies, fetchDomainRenewalsFromCookies } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function PortalDomainRenewalsPage({
  params,
}: Readonly<{
  params: { locale: string; domainId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");
  const cookieHeader = cookies().toString();
  const [domain, renewals] = await Promise.all([
    fetchDomainFromCookies(cookieHeader, params.domainId, "client"),
    fetchDomainRenewalsFromCookies(cookieHeader, params.domainId, "client"),
  ]);

  if (!domain) {
    notFound();
  }

  return (
    <PortalShell
      actions={
        <Link
          className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, `/portal/domains/${domain.id}`)}
        >
          {t("backToDomainButton")}
        </Link>
      }
      currentPath={`/portal/domains/${domain.id}/renewals`}
      description={t("portalRenewalHistoryDescription")}
      locale={params.locale as AppLocale}
      title={t("renewalHistoryTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("renewalHistoryTitle")}</h2>
        {renewals && renewals.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {renewals.map((renewal) => (
              <div key={renewal.id} className="rounded-[1.5rem] border border-line bg-white/80 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-foreground">{t("renewalYearsValue", { years: renewal.years })}</p>
                  <span className="rounded-full border border-line bg-accentSoft px-3 py-1 text-xs font-semibold text-foreground">{renewal.status}</span>
                </div>
                <p className="mt-3 text-sm text-muted">{renewal.price} / {renewal.renewed_at ?? renewal.created_at ?? t("notAvailable")}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">{t("noRenewals")}</p>
        )}
      </section>
    </PortalShell>
  );
}
