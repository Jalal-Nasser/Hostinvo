import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NetworkIncidentManager } from "@/components/tenant-admin/network-incident-manager";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchNetworkIncidentsFromCookies } from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function IncidentContentPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const copy = tenantAdminCopy(params.locale);
  const response = await fetchNetworkIncidentsFromCookies(
    cookies().toString(),
    "admin",
  );
  const incidents = response && !Array.isArray(response) ? response.data : [];

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
      currentPath="/dashboard/content/incidents"
      description={copy.incidents.pageDescription}
      locale={params.locale as AppLocale}
      title={copy.incidents.pageTitle}
    >
      <NetworkIncidentManager locale={params.locale} incidents={incidents} />
    </DashboardShell>
  );
}
