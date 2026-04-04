import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PortalContentBlockManager } from "@/components/tenant-admin/portal-content-block-manager";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchPortalContentBlocksFromCookies } from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function ContentBlocksPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const copy = tenantAdminCopy(params.locale);
  const response = await fetchPortalContentBlocksFromCookies(
    cookies().toString(),
    "admin",
  );
  const blocks = response && !Array.isArray(response) ? response.data : [];

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
      currentPath="/dashboard/content/website-security"
      description={copy.blocks.pageDescription}
      locale={params.locale as AppLocale}
      title={copy.blocks.pageTitle}
    >
      <PortalContentBlockManager locale={params.locale} blocks={blocks} />
    </DashboardShell>
  );
}
