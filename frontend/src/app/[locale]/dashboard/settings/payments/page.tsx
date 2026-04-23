import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PaymentGatewaySettingsPanel } from "@/components/tenant-admin/payment-gateway-settings-panel";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { type AppLocale } from "@/i18n/routing";
import {
  getAuthenticatedUserFromCookies,
  hasPermission,
  hasRole,
  isPlatformOwnerContext,
  localePath,
} from "@/lib/auth";
import { fetchTenantPaymentGatewaySettingsFromCookies } from "@/lib/payment-settings";

export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const isArabic = params.locale === "ar";
  const copy = {
    title: isArabic ? "بوابات الدفع" : "Payment gateways",
    description: isArabic
      ? "إدارة Stripe وPayPal والدفع اليدوي لمساحة العمل الحالية."
      : "Manage Stripe, PayPal, and manual payment settings for the current workspace.",
    backToSettings: isArabic ? "العودة إلى الإعدادات" : "Back to settings",
    tenantOnlyMessage: isArabic
      ? "هذه الصفحة متاحة فقط داخل مساحة عمل مستأجر فعالة."
      : "This page is available only inside an active tenant workspace.",
    unauthorizedMessage: isArabic
      ? "ليس لديك صلاحية لإدارة بوابات الدفع لهذه المساحة."
      : "You do not have permission to manage payment gateways for this workspace.",
    platformMessage: isArabic
      ? "بوابات الدفع هنا تخص المستأجر فقط وليست طبقة المنصة."
      : "These payment gateway settings are tenant-only and do not apply to the platform owner layer.",
    serviceUnavailable: isArabic ? "الخدمة غير متاحة حالياً." : "The service is currently unavailable.",
  };

  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);
  const isPlatformOwner = isPlatformOwnerContext(user);
  const canManagePaymentSettings =
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
        currentPath="/dashboard/settings/payments"
        description={copy.description}
        locale={params.locale as AppLocale}
        title={copy.title}
      >
        <StatusBanner message={copy.platformMessage} tone="error" />
      </DashboardShell>
    );
  }

  if (!user?.tenant_id) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/payments"
        description={copy.description}
        locale={params.locale as AppLocale}
        title={copy.title}
      >
        <StatusBanner message={copy.tenantOnlyMessage} tone="error" />
      </DashboardShell>
    );
  }

  if (!canManagePaymentSettings) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/payments"
        description={copy.description}
        locale={params.locale as AppLocale}
        title={copy.title}
      >
        <StatusBanner message={copy.unauthorizedMessage} tone="error" />
      </DashboardShell>
    );
  }

  const settings = await fetchTenantPaymentGatewaySettingsFromCookies(cookieHeader);

  if (!settings) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/payments"
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
      currentPath="/dashboard/settings/payments"
      description={copy.description}
      locale={params.locale as AppLocale}
      title={copy.title}
    >
      <PaymentGatewaySettingsPanel initialSettings={settings} locale={params.locale} />
    </DashboardShell>
  );
}
