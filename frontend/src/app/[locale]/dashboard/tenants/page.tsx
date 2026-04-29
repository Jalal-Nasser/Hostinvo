import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { FilterBar, SectionHeader } from "@/components/dashboard/admin-ui";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TenantRowActions } from "@/components/platform-owner/tenant-row-actions";
import { type AppLocale } from "@/i18n/routing";
import {
  getAuthenticatedUserFromCookies,
  hasRole,
  localePath,
} from "@/lib/auth";
import { fetchTenantsFromCookies } from "@/lib/tenants";

export const dynamic = "force-dynamic";

function capitalizeDisplayValue(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

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
      actions={
        <Link
          aria-label={t("createTenantButton")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#036deb] text-white shadow-[0_8px_20px_rgba(3,109,235,0.16)] transition hover:bg-[#0255b6]"
          href={localePath(params.locale, "/admin/tenants/create")}
          title={t("createTenantButton")}
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 5v14m7-7H5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.9"
            />
          </svg>
        </Link>
      }
      currentPath="/dashboard/tenants"
      description={t("pageDescription")}
      locale={params.locale as AppLocale}
      title={t("pageTitle")}
    >
      <section className="glass-card dashboard-compact-card">
        <SectionHeader
          actions={
            <span className="tenant-count-pill">
              {t("tenantCountLabel", { count: total })}
            </span>
          }
          title={t("tenantListHeading")}
        />

        <FilterBar id="tenant-filters">
          <label className="dashboard-filter-field">
            <span>{t("searchLabel")}</span>
            <input
              className="dashboard-filter-control"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("searchPlaceholder")}
            />
          </label>

          <label className="dashboard-filter-field md:max-w-[220px]">
            <span>{t("statusFilterLabel")}</span>
            <select
              className="dashboard-filter-control"
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="active">{t("statusActive")}</option>
              <option value="suspended">{t("statusSuspended")}</option>
            </select>
          </label>

          <div className="dashboard-filter-actions">
            <button className="dashboard-filter-primary" type="submit">
              {t("filterButton")}
            </button>
            <Link
              className="dashboard-filter-secondary"
              href={localePath(params.locale, "/dashboard/tenants")}
            >
              {t("clearFiltersButton")}
            </Link>
          </div>
        </FilterBar>

        {tenants.length === 0 ? (
          <div className="tenant-empty-state">
            {t("emptyStateDescription")}
          </div>
        ) : (
          <div className="tenant-table-wrap">
            <table className="tenant-table">
              <thead>
                <tr>
                  <th>{t("tenantColumnLabel")}</th>
                  <th>{t("ownerColumnLabel")}</th>
                  <th>{t("planLabel")}</th>
                  <th>{t("licenseStatusLabel")}</th>
                  <th>{t("createdAtLabel")}</th>
                  <th className="text-end">{t("actionsColumnLabel")}</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => {
                  const subtitle =
                    tenant.owner?.email ?? tenant.primary_domain ?? t("notAvailable");

                  return (
                    <tr key={tenant.id}>
                      <td>
                        <div className="tenant-identity">
                          <span className="tenant-avatar" aria-hidden="true">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M5 20V5.5A1.5 1.5 0 016.5 4h7A1.5 1.5 0 0115 5.5V20m-7-9h2m-2 4h2m4-4h2m-2 4h2m-9 5h12m-4 0v-5.5A1.5 1.5 0 0116.5 13h1A1.5 1.5 0 0119 14.5V20" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                            </svg>
                          </span>
                          <div className="tenant-cell-main">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                className="tenant-name-link"
                                href={localePath(params.locale, `/dashboard/tenants/${tenant.id}`)}
                              >
                                {tenant.name}
                              </Link>
                              <span
                                className={[
                                  "tenant-status-pill",
                                  tenant.status === "active"
                                    ? "tenant-status-active"
                                    : "tenant-status-suspended",
                                ].join(" ")}
                              >
                                {tenant.status === "active" ? t("statusActive") : t("statusSuspended")}
                              </span>
                            </div>
                            <p>{subtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="tenant-owner-stack">
                          <span>{tenant.owner?.name ?? t("noOwnerAssigned")}</span>
                          <p>{tenant.owner?.email ?? t("notAvailable")}</p>
                        </div>
                      </td>
                      <td>
                        <div className="tenant-plan-stack">
                          <span>{capitalizeDisplayValue(tenant.license_summary?.plan ?? tenant.plan)}</span>
                          {tenant.license_summary?.is_trial ? <p>Trial</p> : null}
                        </div>
                      </td>
                      <td>
                        <div className="tenant-license-stack">
                          <span>
                            <i aria-hidden="true" />
                            {capitalizeDisplayValue(tenant.license_summary?.status) ?? t("licenseUnavailable")}
                          </span>
                          <p>
                            {tenant.license_summary?.expires_at
                              ? new Date(tenant.license_summary.expires_at).toLocaleDateString(params.locale, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : t("notAvailable")}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className="tenant-created-text">
                          {tenant.created_at
                            ? new Date(tenant.created_at).toLocaleDateString(params.locale, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : t("notAvailable")}
                        </span>
                      </td>
                      <td>
                        <TenantRowActions
                          tenantId={tenant.id}
                          locale={params.locale}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
