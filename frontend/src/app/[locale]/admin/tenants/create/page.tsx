import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TenantForm } from "@/components/platform-owner/tenant-form";
import { type AppLocale } from "@/i18n/routing";
import {
  getAuthenticatedUserFromCookies,
  hasRole,
  localePath,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TenantCreatePage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Tenants");
  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);

  if (!user) {
    redirect(localePath(params.locale, "/auth/login"));
  }

  if (!hasRole(user, "super_admin")) {
    redirect(localePath(params.locale, "/dashboard"));
  }

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/tenants")}
          className="btn-secondary whitespace-nowrap"
        >
          {t("backToTenantsButton")}
        </Link>
      }
      currentPath="/dashboard/tenants"
      description={t("createTenantDescription")}
      locale={params.locale as AppLocale}
      title={t("createTenantHeading")}
    >
      <TenantForm locale={params.locale} mode="create" />
    </DashboardShell>
  );
}
