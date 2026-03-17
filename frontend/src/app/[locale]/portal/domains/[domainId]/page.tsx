import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchDomainFromCookies } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function PortalDomainDetailsPage({
  params,
}: Readonly<{
  params: { locale: string; domainId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");
  const domain = await fetchDomainFromCookies(cookies().toString(), params.domainId, "client");

  if (!domain) {
    notFound();
  }

  return (
    <PortalShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            href={localePath(params.locale, `/portal/domains/${domain.id}/contacts`)}
          >
            {t("contactsButton")}
          </Link>
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, `/portal/domains/${domain.id}/renewals`)}
          >
            {t("renewalHistoryButton")}
          </Link>
        </div>
      }
      currentPath={`/portal/domains/${domain.id}`}
      description={t("portalDetailsDescription")}
      locale={params.locale as AppLocale}
      title={domain.domain}
    >
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statusLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.status}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("registrarLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.registrar ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("registrationDateLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.registration_date ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("expiryDateLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.expiry_date ?? t("notAvailable")}</p>
            </div>
          </div>
        </article>

        <aside className="glass-card p-6 md:p-8">
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("autoRenewLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.auto_renew ? t("yesLabel") : t("noLabel")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("dnsManagementLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.dns_management ? t("yesLabel") : t("noLabel")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("idProtectionLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.id_protection ? t("yesLabel") : t("noLabel")}</p>
            </div>
          </div>
        </aside>
      </section>
    </PortalShell>
  );
}
