import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DomainContactManager } from "@/components/domains/domain-contact-manager";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchDomainContactsFromCookies, fetchDomainFromCookies } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function DomainContactsPage({
  params,
}: Readonly<{
  params: { locale: string; domainId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");
  const cookieHeader = cookies().toString();
  const [domain, contacts] = await Promise.all([
    fetchDomainFromCookies(cookieHeader, params.domainId, "admin"),
    fetchDomainContactsFromCookies(cookieHeader, params.domainId, "admin"),
  ]);

  if (!domain) {
    notFound();
  }

  return (
    <DashboardShell
      actions={
        <Link
          className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, `/dashboard/domains/${domain.id}`)}
        >
          {t("backToDomainButton")}
        </Link>
      }
      currentPath={`/dashboard/domains/${domain.id}/contacts`}
      description={t("contactsDescription")}
      locale={params.locale as AppLocale}
      title={t("contactsTitle", { domain: domain.domain })}
    >
      <DomainContactManager contacts={contacts ?? []} domainId={domain.id} mode="admin" />
    </DashboardShell>
  );
}
