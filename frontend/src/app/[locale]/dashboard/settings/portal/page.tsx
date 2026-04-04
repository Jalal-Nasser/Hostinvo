import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { PortalSurfaceForm } from "@/components/tenant-admin/portal-surface-form";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchPortalSurfaceFromCookies } from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function PortalSurfaceSettingsPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const copy = tenantAdminCopy(params.locale);
  const surface = await fetchPortalSurfaceFromCookies(cookies().toString());

  if (!surface) {
    return null;
  }

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/settings")}
          className="btn-secondary whitespace-nowrap"
        >
          {copy.common.backToSettings}
        </Link>
      }
      currentPath="/dashboard/settings/portal"
      description={copy.surface.pageDescription}
      locale={params.locale as AppLocale}
      title={copy.surface.pageTitle}
    >
      <PortalSurfaceForm locale={params.locale} initialSurface={surface} />
    </DashboardShell>
  );
}
