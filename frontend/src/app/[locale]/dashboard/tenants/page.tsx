import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TenantForm } from "@/components/platform-owner/tenant-form";
import { TenantImpersonationButtons } from "@/components/platform-owner/tenant-impersonation-buttons";
import { type AppLocale } from "@/i18n/routing";
import {
  getAuthenticatedUserFromCookies,
  hasRole,
  localePath,
} from "@/lib/auth";
import { fetchTenantsFromCookies } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function TenantsPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { search?: string; status?: string; page?: string };
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

  const response = await fetchTenantsFromCookies(cookieHeader, {
    search: searchParams?.search,
    status: searchParams?.status,
    page: searchParams?.page,
  });

  const tenants = response?.data ?? [];
  const total = response?.meta?.total ?? tenants.length;

  return (
    <DashboardShell
      currentPath="/dashboard/tenants"
      description={t("pageDescription")}
      locale={params.locale as AppLocale}
      title={t("pageTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <p className="dashboard-kicker">{t("platformOwnerBadge")}</p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
            {t("pageHeading")}
          </h2>
          <p className="text-sm leading-7 text-[#6b7280]">{t("platformOwnerDescription")}</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("searchLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              form="tenant-filters"
              placeholder={t("searchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusFilterLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.status ?? ""}
              form="tenant-filters"
              name="status"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="active">{t("statusActive")}</option>
              <option value="suspended">{t("statusSuspended")}</option>
            </select>
          </label>

          <form id="tenant-filters" className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              type="submit"
            >
              {t("filterButton")}
            </button>
            <Link
              className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
              href={localePath(params.locale, "/dashboard/tenants")}
            >
              {t("clearFiltersButton")}
            </Link>
          </form>
        </div>
      </section>

      <div className="grid gap-6">
        <TenantForm locale={params.locale} mode="create" />

        <section className="glass-card p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <p className="dashboard-kicker">{t("tenantListTitle")}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
                {t("tenantListHeading")}
              </h2>
              <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#123055]">
                {t("tenantCountLabel", { count: total })}
              </span>
            </div>
          </div>

          {tenants.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#fcfcfb] px-5 py-5 text-sm leading-7 text-[#6b7280]">
              {t("emptyStateDescription")}
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {tenants.map((tenant) => (
                <article
                  key={tenant.id}
                  className="rounded-2xl border border-[#e5e7eb] bg-[#fcfcfb] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-[#0a1628]">
                          {tenant.name}
                        </h3>
                        <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#123055]">
                          {tenant.status === "active" ? t("statusActive") : t("statusSuspended")}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#6b7280]">
                        {tenant.primary_domain ?? t("notAvailable")}
                      </p>
                      <p className="mt-2 text-sm text-[#6b7280]">
                        {tenant.owner?.name ?? t("noOwnerAssigned")} / {tenant.owner?.email ?? t("notAvailable")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                        href={localePath(params.locale, `/dashboard/tenants/${tenant.id}`)}
                      >
                        {t("viewTenantButton")}
                      </Link>
                      <TenantImpersonationButtons
                        tenantId={tenant.id}
                        locale={params.locale}
                        compact
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">
                        {t("localeLabel")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#0a1628]">{tenant.default_locale}</p>
                    </div>
                    <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">
                        {t("currencyLabel")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#0a1628]">{tenant.default_currency}</p>
                    </div>
                    <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">
                        {t("planLabel")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#0a1628]">
                        {tenant.license_summary?.plan ?? tenant.plan}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">
                        {t("licenseStatusLabel")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#0a1628]">
                        {tenant.license_summary?.status ?? t("licenseUnavailable")}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
