import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ServerConnectionTester } from "@/components/provisioning/server-connection-tester";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchServersFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function ServersPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: {
    search?: string;
    status?: string;
    panel_type?: string;
    page?: string;
  };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Provisioning");
  const response = await fetchServersFromCookies(cookies().toString(), {
    search: searchParams?.search,
    status: searchParams?.status,
    panel_type: searchParams?.panel_type,
    page: searchParams?.page,
  });

  const servers = response?.data ?? [];

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href={localePath(params.locale, "/dashboard/servers/new")}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            {t("newServerButton")}
          </Link>
          <Link
            href={localePath(params.locale, "/dashboard/provisioning")}
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          >
            {t("jobsTitle")}
          </Link>
        </div>
      }
      currentPath="/dashboard/servers"
      description={t("serversDescription")}
      locale={params.locale as AppLocale}
      title={t("serversTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("searchLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("serverSearchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("serverStatusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allServerStatuses")}</option>
              <option value="active">{t("serverStatusActive")}</option>
              <option value="inactive">{t("serverStatusInactive")}</option>
              <option value="maintenance">{t("serverStatusMaintenance")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("panelTypeLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.panel_type ?? ""}
              name="panel_type"
            >
              <option value="">{t("allPanelTypes")}</option>
              <option value="cpanel">{t("panelTypeCpanel")}</option>
              <option value="plesk">{t("panelTypePlesk")}</option>
              <option value="directadmin">{t("panelTypeDirectadmin")}</option>
              <option value="custom">{t("panelTypeCustom")}</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              type="submit"
            >
              {t("searchButton")}
            </button>

            <Link
              className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
              href={localePath(params.locale, "/dashboard/servers")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {servers.length === 0 ? (
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("serversEmptyTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("serversEmptyDescription")}</p>
        </section>
      ) : (
        <section className="grid gap-4">
          {servers.map((server) => (
            <article key={server.id} className="server-widget-card">
              <div className="server-widget-main">
                <span className="server-widget-icon" aria-hidden="true">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5.5 5.5h13A1.5 1.5 0 0120 7v3.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 10.5V7a1.5 1.5 0 011.5-1.5zm0 6.5h13A1.5 1.5 0 0120 13.5V17a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17v-3.5A1.5 1.5 0 015.5 12zM8 8.75h.01M8 15.25h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                </span>
                <div className="server-widget-title">
                  <h2>{server.name}</h2>
                  <div className="server-widget-badges">
                    <span className="server-status-pill">
                      {t(`serverStatus${server.status.charAt(0).toUpperCase()}${server.status.slice(1)}`)}
                    </span>
                    <span className="server-panel-pill">
                      {server.panel_type === "cpanel"
                        ? t("panelTypeCpanel")
                        : server.panel_type === "plesk"
                          ? t("panelTypePlesk")
                          : server.panel_type === "directadmin"
                            ? t("panelTypeDirectadmin")
                            : t("panelTypeCustom")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="server-widget-actions">
                  <Link
                    className="server-widget-action"
                    href={localePath(params.locale, `/dashboard/servers/${server.id}`)}
                  >
                    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    </svg>
                    {t("viewServerButton")}
                  </Link>

                  <ServerConnectionTester
                    serverId={server.id}
                    buttonLabel={t("testConnectionButton")}
                    runningLabel={t("testingConnection")}
                    successLabel={t("testConnectionSuccess")}
                    errorLabel={t("testConnectionError")}
                    variant="server-widget"
                  />
              </div>
            </article>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
