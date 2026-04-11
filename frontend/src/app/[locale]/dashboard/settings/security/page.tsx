import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { MfaSettingsPanel } from "@/components/platform-owner/mfa-settings-panel";
import { type AppLocale } from "@/i18n/routing";
import {
  getAuthenticatedUserFromCookies,
  hasRole,
  localePath,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);

  const isAr = params.locale === "ar";
  const pageTitle = isAr ? "أمان الحساب" : "Account security";
  const pageDescription = isAr
    ? "أدر المصادقة الثنائية ورموز الاسترداد لحساب المشرف العام."
    : "Manage two-factor authentication and recovery codes for your super admin account.";
  const notSuperAdminMsg = isAr
    ? "إعدادات MFA متاحة فقط لحسابات المشرف العام."
    : "MFA settings are only available for super admin accounts.";
  const backLabel = isAr ? "العودة إلى الإعدادات" : "Back to settings";

  const actions = (
    <Link
      href={localePath(params.locale, "/dashboard/settings")}
      className="btn-secondary whitespace-nowrap"
    >
      {backLabel}
    </Link>
  );

  if (!hasRole(user, "super_admin")) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/security"
        description={pageDescription}
        locale={params.locale as AppLocale}
        title={pageTitle}
      >
        <StatusBanner message={notSuperAdminMsg} tone="error" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      actions={actions}
      currentPath="/dashboard/settings/security"
      description={pageDescription}
      locale={params.locale as AppLocale}
      title={pageTitle}
    >
      <MfaSettingsPanel locale={params.locale} />
    </DashboardShell>
  );
}
