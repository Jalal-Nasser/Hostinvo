import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchClientsFromCookies, type ClientRecord, type ClientStatus } from "@/lib/clients";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { search?: string; status?: string; page?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Clients");
  const response = await fetchClientsFromCookies(cookies().toString(), {
    search: searchParams?.search,
    status: searchParams?.status,
    page: searchParams?.page,
  });

  const clients = response?.data ?? [];
  const meta = response?.meta;
  const currentPage = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;
  const perPage = meta?.per_page ?? clients.length;
  const total = meta?.total ?? clients.length;
  const firstRecord = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const lastRecord = total === 0 ? 0 : firstRecord + clients.length - 1;
  const basePath = localePath(params.locale, "/dashboard/clients");
  const statusLabels: Record<ClientStatus, string> = {
    active: t("statusActive"),
    inactive: t("statusInactive"),
    lead: t("statusLead"),
  };
  const pageHref = (page: number) => {
    const query = new URLSearchParams();

    if (searchParams?.search) {
      query.set("search", searchParams.search);
    }

    if (searchParams?.status) {
      query.set("status", searchParams.status);
    }

    if (page > 1) {
      query.set("page", String(page));
    }

    const serialized = query.toString();

    return serialized ? `${basePath}?${serialized}` : basePath;
  };

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/clients/new")}
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {t("newClientButton")}
        </Link>
      }
      currentPath="/dashboard/clients"
      description={t("listDescription")}
      locale={params.locale as AppLocale}
      title={t("listTitle")}
    >
      <section className="client-list-panel">
        <form className="client-search-bar">
          <div className="client-search-mark" aria-hidden="true">
            <span />
          </div>

          <label className="client-filter-field">
            <span>{t("searchLabel")}</span>
            <input
              className="client-filter-control"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("searchPlaceholder")}
            />
          </label>

          <label className="client-filter-field">
            <span>{t("statusLabel")}</span>
            <select
              className="client-filter-control"
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="active">{t("statusActive")}</option>
              <option value="inactive">{t("statusInactive")}</option>
              <option value="lead">{t("statusLead")}</option>
            </select>
          </label>

          <div className="client-filter-actions">
            <button
              className="client-filter-primary"
              type="submit"
            >
              {t("searchButton")}
            </button>

            <Link
              className="client-filter-secondary"
              href={basePath}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>

        <div className="client-list-meta">
          <span>
            {total} Records Found, Showing {firstRecord} to {lastRecord}
          </span>
          <span>
            Jump to Page: <strong>{currentPage}</strong>
          </span>
        </div>

        {clients.length === 0 ? (
          <section className="client-empty-state">
          <h2 className="text-2xl font-semibold text-foreground">{t("emptyStateTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("emptyStateDescription")}</p>
          </section>
        ) : (
          <>
            <div className="client-table-wrap">
              <table className="client-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t("firstNameLabel")}</th>
                    <th>{t("lastNameLabel")}</th>
                    <th>{t("companyNameLabel")}</th>
                    <th>{t("emailLabel")}</th>
                    <th>{t("servicesCountLabel")}</th>
                    <th>{t("createdAtLabel")}</th>
                    <th>{t("statusLabel")}</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, index) => (
                    <tr key={client.id}>
                      <td className="client-table-id">{firstRecord + index}</td>
                      <td>{client.first_name || displayNamePart(client, "first")}</td>
                      <td>{client.last_name || displayNamePart(client, "last")}</td>
                      <td>{client.company_name || client.display_name}</td>
                      <td>
                        <a className="client-email-link" href={`mailto:${client.email}`}>
                          {client.email}
                        </a>
                      </td>
                      <td>{client.services_count ?? 0}</td>
                      <td>{formatClientDate(client.created_at, params.locale)}</td>
                      <td>
                        <span className={`client-status-pill client-status-${client.status}`}>
                          {statusLabels[client.status]}
                        </span>
                      </td>
                      <td>
                        <div className="client-row-actions">
                          <Link
                            className="client-row-action"
                            href={localePath(params.locale, `/dashboard/clients/${client.id}`)}
                          >
                            {t("viewDetails")}
                          </Link>
                          <Link
                            className="client-row-action"
                            href={localePath(params.locale, `/dashboard/clients/${client.id}/edit`)}
                          >
                            {t("editClientButton")}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {lastPage > 1 ? (
              <nav className="client-pagination" aria-label="Client pagination">
                <Link
                  aria-disabled={currentPage <= 1}
                  className="client-page-link"
                  href={currentPage <= 1 ? pageHref(1) : pageHref(currentPage - 1)}
                >
                  &laquo; Previous Page
                </Link>
                <span className="client-page-current">{currentPage}</span>
                <Link
                  aria-disabled={currentPage >= lastPage}
                  className="client-page-link"
                  href={currentPage >= lastPage ? pageHref(lastPage) : pageHref(currentPage + 1)}
                >
                  Next Page &raquo;
                </Link>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </DashboardShell>
  );
}

function displayNamePart(client: ClientRecord, part: "first" | "last") {
  const parts = client.display_name.trim().split(/\s+/);

  if (part === "first") {
    return parts[0] ?? "-";
  }

  return parts.length > 1 ? parts.slice(1).join(" ") : "-";
}

function formatClientDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
