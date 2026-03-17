import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { DomainContactManager } from "@/components/domains/domain-contact-manager";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchDomainContactsFromCookies, fetchDomainFromCookies } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function PortalDomainContactsPage({
  params,
}: Readonly<{
  params: { locale: string; domainId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");
  const cookieHeader = cookies().toString();
  const [domain, contacts] = await Promise.all([
    fetchDomainFromCookies(cookieHeader, params.domainId, "client"),
    fetchDomainContactsFromCookies(cookieHeader, params.domainId, "client"),
  ]);

  if (!domain) {
    notFound();
  }

  return (
    <PortalShell
      actions={
        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, `/portal/domains/${domain.id}`)}
        >
          {t("backToDomainButton")}
        </Link>
      }
      currentPath={`/portal/domains/${domain.id}/contacts`}
      description={t("portalContactsDescription")}
      locale={params.locale as AppLocale}
      title={t("contactsTitle", { domain: domain.domain })}
    >
      <DomainContactManager contacts={contacts ?? []} domainId={domain.id} mode="client" />
    </PortalShell>
  );
}
