import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PortalFooterLinkManager } from "@/components/tenant-admin/portal-footer-link-manager";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchPortalFooterLinksFromCookies } from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function FooterLinksPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const copy = tenantAdminCopy(params.locale);
  const response = await fetchPortalFooterLinksFromCookies(cookies().toString());
  const links = response?.data ?? [];

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/content")}
          className="btn-secondary whitespace-nowrap"
        >
          {copy.common.backToContent}
        </Link>
      }
      currentPath="/dashboard/content/footer-links"
      description={copy.footer.pageDescription}
      locale={params.locale as AppLocale}
      title={copy.footer.pageTitle}
    >
      <PortalFooterLinkManager locale={params.locale} links={links} />
    </DashboardShell>
  );
}
