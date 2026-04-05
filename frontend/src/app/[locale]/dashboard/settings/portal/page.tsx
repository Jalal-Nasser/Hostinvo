import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { PortalSurfaceForm } from "@/components/tenant-admin/portal-surface-form";
import { type AppLocale } from "@/i18n/routing";
import { getAuthenticatedUserFromCookies, localePath } from "@/lib/auth";
import { fetchPortalSurfaceFromCookies } from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function PortalSurfaceSettingsPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const copy = tenantAdminCopy(params.locale);
  const cookieHeader = cookies().toString();
  const [user, surface] = await Promise.all([
    getAuthenticatedUserFromCookies(cookieHeader),
    fetchPortalSurfaceFromCookies(cookieHeader),
  ]);
  const tenantWorkspaceMessage =
    params.locale === "ar"
      ? "إعدادات واجهة البوابة متاحة فقط داخل مساحة عمل مستأجر فعالة. سجّل الدخول كمدير مزود أو أكمل إعداد المستأجر أولاً."
      : "Portal surface settings are available only inside an active tenant workspace. Sign in as a provider admin or complete tenant setup first.";

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
        currentPath="/dashboard/settings/portal"
        description={copy.surface.pageDescription}
        locale={params.locale as AppLocale}
        title={copy.surface.pageTitle}
      >
        <StatusBanner message={tenantWorkspaceMessage} tone="error" />
      </DashboardShell>
    );
  }

  if (!surface) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/portal"
        description={copy.surface.pageDescription}
        locale={params.locale as AppLocale}
        title={copy.surface.pageTitle}
      >
        <StatusBanner message={copy.common.serviceUnavailable} tone="error" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      actions={actions}
      currentPath="/dashboard/settings/portal"
      description={copy.surface.pageDescription}
      locale={params.locale as AppLocale}
      title={copy.surface.pageTitle}
    >
      <PortalSurfaceForm locale={params.locale} initialSurface={surface} />
    </DashboardShell>
  );
}
