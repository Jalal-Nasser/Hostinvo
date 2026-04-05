import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TenantForm } from "@/components/platform-owner/tenant-form";
import { TenantImpersonationButtons } from "@/components/platform-owner/tenant-impersonation-buttons";
import { TenantStatusActions } from "@/components/platform-owner/tenant-status-actions";
import { type AppLocale } from "@/i18n/routing";
import {
  getAuthenticatedUserFromCookies,
  hasRole,
  localePath,
} from "@/lib/auth";
import { fetchTenantFromCookies } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: Readonly<{
  params: { locale: string; tenantId: string };
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

  const tenant = await fetchTenantFromCookies(cookieHeader, params.tenantId);

  if (!tenant) {
    notFound();
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
      description={t("detailPageDescription")}
      locale={params.locale as AppLocale}
      title={tenant.name}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="glass-card p-5">
          <p className="dashboard-kicker">{t("tenantDomainLabel")}</p>
          <p className="mt-3 text-lg font-semibold text-[#0a1628]">
            {tenant.primary_domain ?? t("notAvailable")}
          </p>
        </article>
        <article className="glass-card p-5">
          <p className="dashboard-kicker">{t("ownerLabel")}</p>
          <p className="mt-3 text-lg font-semibold text-[#0a1628]">
            {tenant.owner?.name ?? t("noOwnerAssigned")}
          </p>
          <p className="mt-1 text-sm text-[#6b7280]">{tenant.owner?.email ?? t("notAvailable")}</p>
        </article>
        <article className="glass-card p-5">
          <p className="dashboard-kicker">{t("planLabel")}</p>
          <p className="mt-3 text-lg font-semibold text-[#0a1628]">
            {tenant.license_summary?.plan ?? tenant.plan}
          </p>
          <p className="mt-1 text-sm text-[#6b7280]">
            {tenant.license_summary?.status ?? t("licenseUnavailable")}
          </p>
        </article>
        <article className="glass-card p-5">
          <p className="dashboard-kicker">{t("createdAtLabel")}</p>
          <p className="mt-3 text-lg font-semibold text-[#0a1628]">
            {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString(params.locale) : t("notAvailable")}
          </p>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TenantForm locale={params.locale} mode="edit" tenant={tenant} />

        <div className="grid gap-6">
          <TenantStatusActions tenantId={tenant.id} status={tenant.status} />
          <section className="glass-card p-6 md:p-8">
            <div className="flex flex-col gap-2">
              <p className="dashboard-kicker">{t("impersonationTitle")}</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
                {t("impersonationHeading")}
              </h2>
              <p className="text-sm leading-7 text-[#6b7280]">
                {t("impersonationDescription")}
              </p>
            </div>
            <div className="mt-6">
              <TenantImpersonationButtons tenantId={tenant.id} locale={params.locale} />
            </div>
          </section>

          <section className="glass-card p-6 md:p-8">
            <div className="flex flex-col gap-2">
              <p className="dashboard-kicker">{t("licenseSummaryTitle")}</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
                {t("licenseSummaryHeading")}
              </h2>
            </div>

            {tenant.license_summary ? (
              <div className="mt-6 grid gap-4">
                <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">{t("licenseStatusLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-[#0a1628]">{tenant.license_summary.status}</p>
                </div>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">{t("licenseDomainLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-[#0a1628]">
                    {tenant.license_summary.domain ?? t("notAvailable")}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">{t("licenseClientsLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-[#0a1628]">
                    {tenant.license_summary.max_clients ?? t("notAvailable")}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">{t("licenseExpiresLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-[#0a1628]">
                    {tenant.license_summary.expires_at
                      ? new Date(tenant.license_summary.expires_at).toLocaleDateString(params.locale)
                      : t("notAvailable")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#fcfcfb] px-5 py-5 text-sm leading-7 text-[#6b7280]">
                {t("licenseSummaryEmpty")}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
