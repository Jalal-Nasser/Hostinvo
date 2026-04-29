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
                  <th>{t("statusColumnLabel")}</th>
                  <th>{t("ownerColumnLabel")}</th>
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
                        <div className="tenant-cell-main">
                          <Link
                            className="tenant-name-link"
                            href={localePath(params.locale, `/dashboard/tenants/${tenant.id}`)}
                          >
                            {tenant.name}
                          </Link>
                          <p>{subtitle}</p>
                        </div>
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <span className="tenant-owner-text">
                          {tenant.owner?.email ?? tenant.owner?.name ?? t("noOwnerAssigned")}
                        </span>
                      </td>
                      <td>
                        <TenantRowActions
                          tenantId={tenant.id}
                          locale={params.locale}
                          status={tenant.status}
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
