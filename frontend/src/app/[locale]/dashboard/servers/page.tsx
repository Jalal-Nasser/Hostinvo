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
        <Link
          href={localePath(params.locale, "/dashboard/provisioning")}
          className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
        >
          {t("jobsTitle")}
        </Link>
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
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("serverSearchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("serverStatusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
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
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.panel_type ?? ""}
              name="panel_type"
            >
              <option value="">{t("allPanelTypes")}</option>
              <option value="cpanel">{t("panelTypeCpanel")}</option>
              <option value="plesk">{t("panelTypePlesk")}</option>
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
              className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
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
            <article key={server.id} className="glass-card p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">{server.name}</h2>
                    <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {t(`serverStatus${server.status.charAt(0).toUpperCase()}${server.status.slice(1)}`)}
                    </span>
                    <span className="rounded-full border border-line bg-[#fffdf8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {server.panel_type === "cpanel" ? t("panelTypeCpanel") : t("panelTypePlesk")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">{server.hostname}</p>
                  <p className="mt-2 text-sm text-muted">
                    {t("serverLoadSummary", {
                      current: server.current_accounts,
                      max: server.max_accounts ?? 0,
                    })}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {server.last_tested_at ?? t("neverTestedLabel")}
                  </p>
                </div>

                <div className="grid gap-3">
                  <Link
                    className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/dashboard/servers/${server.id}`)}
                  >
                    {t("viewServerButton")}
                  </Link>

                  <ServerConnectionTester
                    serverId={server.id}
                    buttonLabel={t("testConnectionButton")}
                    runningLabel={t("testingConnection")}
                    successLabel={t("testConnectionSuccess")}
                    errorLabel={t("testConnectionError")}
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
