import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { TenantBrandingForm } from "@/components/tenant-admin/tenant-branding-form";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchTenantBrandingFromCookies } from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function BrandingSettingsPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const copy = tenantAdminCopy(params.locale);
  const branding = await fetchTenantBrandingFromCookies(cookies().toString());

  if (!branding) {
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
      currentPath="/dashboard/settings/branding"
      description={copy.branding.pageDescription}
      locale={params.locale as AppLocale}
      title={copy.branding.pageTitle}
    >
      <TenantBrandingForm locale={params.locale} initialBranding={branding} />
    </DashboardShell>
  );
}
