import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { type AppLocale } from "@/i18n/routing";
import {
  getAuthenticatedUserFromCookies,
  isPlatformOwnerContext,
  localePath,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

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
      ? "Prepare and review WHMCS import workflows for this tenant workspace."
      : "Prepare and review WHMCS import workflows for this tenant workspace.",
    backToSettings: isArabic ? "Back to settings" : "Back to settings",
    unauthorizedMessage: isArabic
      ? "This import area is available only to tenant admin users."
      : "This import area is available only to tenant admin users.",
    sectionKicker: isArabic ? "Import" : "Import",
    sectionTitle: isArabic ? "WHMCS migration workspace" : "WHMCS migration workspace",
    sectionDescription: isArabic
      ? "Use this area for WHMCS migration entry points. The sidebar location is ready for tenant-admin import workflows."
      : "Use this area for WHMCS migration entry points. The sidebar location is ready for tenant-admin import workflows.",
  };

  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);
  const hasTenantSettingsContext = !isPlatformOwnerContext(user);
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
      <section className="glass-card p-6 md:p-8">
        <p className="dashboard-kicker">{copy.sectionKicker}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
          {copy.sectionTitle}
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b7280]">
          {copy.sectionDescription}
        </p>
      </section>
    </DashboardShell>
  );
}
