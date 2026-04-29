import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WhmcsImportPanel, type WhmcsImportRecord } from "@/components/import/whmcs-import-panel";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { type AppLocale } from "@/i18n/routing";
import {
  apiBaseUrl,
  getAuthenticatedUserFromCookies,
  isPlatformOwnerContext,
  localePath,
  statefulApiHeaders,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

async function fetchLatestImport(cookieHeader: string): Promise<WhmcsImportRecord | null> {
  const response = await fetch(`${apiBaseUrl}/admin/whmcs/import`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, "/dashboard/settings/import/whmcs"),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    data: { import: WhmcsImportRecord | null };
  };

  return payload.data.import;
}

export default async function WhmcsImportSettingsPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const isArabic = params.locale === "ar";
  const copy = {
    title: isArabic ? "WHMCS Migration" : "WHMCS Migration",
    description: isArabic
      ? "Import clients, products, and services from an existing WHMCS installation."
      : "Import clients, products, and services from an existing WHMCS installation.",
    backToSettings: isArabic ? "Back to settings" : "Back to settings",
    unauthorizedMessage: isArabic
      ? "This import area is available only to tenant admin users."
      : "This import area is available only to tenant admin users.",
  };

  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);
  const hasTenantSettingsContext = !isPlatformOwnerContext(user);
  const latestImport = hasTenantSettingsContext ? await fetchLatestImport(cookieHeader) : null;
  const actions = (
    <Link
      href={localePath(params.locale, "/dashboard/settings")}
      className="btn-secondary whitespace-nowrap"
    >
      {copy.backToSettings}
    </Link>
  );

  if (!hasTenantSettingsContext) {
    return (
      <DashboardShell
        actions={actions}
        currentPath="/dashboard/settings/import/whmcs"
        description={copy.description}
        locale={params.locale as AppLocale}
        title={copy.title}
      >
        <StatusBanner message={copy.unauthorizedMessage} tone="error" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      actions={actions}
      currentPath="/dashboard/settings/import/whmcs"
      description={copy.description}
      locale={params.locale as AppLocale}
      title={copy.title}
    >
      <WhmcsImportPanel initialImport={latestImport} />
    </DashboardShell>
  );
}
