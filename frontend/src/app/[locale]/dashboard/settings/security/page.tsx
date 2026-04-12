import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MfaSettingsPanel } from "@/components/platform-owner/mfa-settings-panel";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { TenantSecuritySettingsPanel } from "@/components/tenant-admin/tenant-security-settings-panel";
import { type AppLocale } from "@/i18n/routing";
import {
  getAuthenticatedUserFromCookies,
  hasPermission,
  hasRole,
  isPlatformOwnerContext,
  localePath,
} from "@/lib/auth";
import {
  fetchTenantMfaPolicyFromCookies,
  fetchTenantTurnstileFromCookies,
} from "@/lib/security-settings";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const isArabic = params.locale === "ar";
  const copy = {
    title: isArabic ? "الأمان والوصول" : "Security and access",
    description: isArabic
      ? "إدارة المصادقة متعددة العوامل وحماية النماذج لمساحة العمل الحالية."
      : "Manage multi-factor authentication and form protection for the current workspace.",
    backToSettings: isArabic ? "العودة إلى الإعدادات" : "Back to settings",
    tenantOnlyMessage: isArabic
      ? "هذه الصفحة متاحة فقط داخل مساحة عمل مستأجر فعّالة."
      : "This page is available only inside an active tenant workspace.",
    unauthorizedMessage: isArabic
      ? "ليس لديك صلاحية لإدارة إعدادات الأمان لهذه المساحة."
      : "You do not have permission to manage security settings for this workspace.",
    serviceUnavailable: isArabic ? "الخدمة غير متاحة حالياً." : "The service is currently unavailable.",
  };

  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);
  const isPlatformOwner = isPlatformOwnerContext(user);
  const canManageTenantSecurity =
    hasRole(user, "tenant_owner") ||
    hasRole(user, "tenant_admin") ||
    hasPermission(user, "tenant.manage");

  const actions = (
    <Link
      href={localePath(params.locale, "/dashboard/settings")}
      className="btn-secondary whitespace-nowrap"
    >
      {copy.backToSettings}
    </Link>
  );

  if (isPlatformOwner) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/security"
        description={copy.description}
        locale={params.locale as AppLocale}
        title={copy.title}
      >
        <MfaSettingsPanel locale={params.locale} />
      </DashboardShell>
    );
  }

  if (!user?.tenant_id) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/security"
        description={copy.description}
        locale={params.locale as AppLocale}
        title={copy.title}
      >
        <StatusBanner message={copy.tenantOnlyMessage} tone="error" />
      </DashboardShell>
    );
  }

  if (!canManageTenantSecurity) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/security"
        description={copy.description}
        locale={params.locale as AppLocale}
        title={copy.title}
      >
        <StatusBanner message={copy.unauthorizedMessage} tone="error" />
      </DashboardShell>
    );
  }

  const [mfaPolicy, turnstile] = await Promise.all([
    fetchTenantMfaPolicyFromCookies(cookieHeader),
    fetchTenantTurnstileFromCookies(cookieHeader),
  ]);

  if (!mfaPolicy || !turnstile) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/security"
        description={copy.description}
        locale={params.locale as AppLocale}
        title={copy.title}
      >
        <StatusBanner message={copy.serviceUnavailable} tone="error" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      actions={actions}
      currentPath="/dashboard/settings/security"
      description={copy.description}
      locale={params.locale as AppLocale}
      title={copy.title}
    >
      <TenantSecuritySettingsPanel
        initialMfaPolicy={mfaPolicy}
        initialTurnstile={turnstile}
        locale={params.locale}
      />
    </DashboardShell>
  );
}
