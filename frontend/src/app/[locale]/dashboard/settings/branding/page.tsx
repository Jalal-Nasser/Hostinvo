import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { TenantBrandingForm } from "@/components/tenant-admin/tenant-branding-form";
import { type AppLocale } from "@/i18n/routing";
import { getAuthenticatedUserFromCookies, localePath } from "@/lib/auth";
import { fetchTenantBrandingFromCookies } from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function BrandingSettingsPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const copy = tenantAdminCopy(params.locale);
  const cookieHeader = cookies().toString();
  const [user, branding] = await Promise.all([
    getAuthenticatedUserFromCookies(cookieHeader),
    fetchTenantBrandingFromCookies(cookieHeader),
  ]);
  const tenantWorkspaceMessage =
    params.locale === "ar"
      ? "إعدادات الهوية والعلامة متاحة فقط داخل مساحة عمل مستأجر فعالة. سجّل الدخول كمدير مزود أو أكمل إعداد المستأجر أولاً."
      : "Branding settings are available only inside an active tenant workspace. Sign in as a provider admin or complete tenant setup first.";

  const actions = (
    <Link
      href={localePath(params.locale, "/dashboard/settings")}
      className="btn-secondary whitespace-nowrap"
    >
      {copy.common.backToSettings}
    </Link>
  );

  if (!user?.tenant_id) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/branding"
        description={copy.branding.pageDescription}
        locale={params.locale as AppLocale}
        title={copy.branding.pageTitle}
      >
        <StatusBanner message={tenantWorkspaceMessage} tone="error" />
      </DashboardShell>
    );
  }

  if (!branding) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/branding"
        description={copy.branding.pageDescription}
        locale={params.locale as AppLocale}
        title={copy.branding.pageTitle}
      >
        <StatusBanner message={copy.common.serviceUnavailable} tone="error" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      actions={actions}
      currentPath="/dashboard/settings/branding"
      description={copy.branding.pageDescription}
      locale={params.locale as AppLocale}
      title={copy.branding.pageTitle}
    >
      <TenantBrandingForm locale={params.locale} initialBranding={branding} />
    </DashboardShell>
  );
}
