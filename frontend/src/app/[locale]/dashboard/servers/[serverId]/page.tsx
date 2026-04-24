import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PleskSubscriptionImporter } from "@/components/provisioning/plesk-subscription-importer";
import { ProvisioningJobRetryButton } from "@/components/provisioning/provisioning-job-retry-button";
import { ServerConnectionTester } from "@/components/provisioning/server-connection-tester";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProductsFromCookies } from "@/lib/catalog";
import { fetchClientsFromCookies } from "@/lib/clients";
import { fetchPleskImportPreviewFromCookies, fetchServerFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function ServerDetailsPage({
  params,
}: Readonly<{
  params: { locale: string; serverId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Provisioning");
  const cookieHeader = cookies().toString();
  const server = await fetchServerFromCookies(cookieHeader, params.serverId);

  if (!server) {
    notFound();
  }

  const [productsResponse, clientsResponse, pleskPreview] = server.panel_type === "plesk"
    ? await Promise.all([
        fetchProductsFromCookies(cookieHeader, { type: "hosting", per_page: "100" }),
        fetchClientsFromCookies(cookieHeader, { per_page: "100" }),
        fetchPleskImportPreviewFromCookies(cookieHeader, params.serverId),
      ])
    : [null, null, null];

  function operationLabel(operation: string) {
    switch (operation) {
      case "create_account":
        return t("operationCreateAccount");
      case "suspend_account":
        return t("operationSuspendAccount");
      case "unsuspend_account":
        return t("operationUnsuspendAccount");
      case "terminate_account":
        return t("operationTerminateAccount");
      case "change_package":
        return t("operationChangePackage");
      case "reset_password":
        return t("operationResetPassword");
      case "sync_usage":
        return t("operationSyncUsage");
      case "sync_service_status":
        return t("operationSyncServiceStatus");
      case "test_connection":
        return t("operationTestConnection");
      default:
        return operation;
    }
  }

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, "/dashboard/servers")}
          >
            {t("backToServersButton")}
          </Link>
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, `/dashboard/servers/${server.id}/edit`)}
          >
            {t("editServerButton")}
          </Link>
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, "/dashboard/provisioning")}
          >
            {t("jobsTitle")}
          </Link>
        </div>
      }
      currentPath={`/dashboard/servers/${server.id}`}
      description={t("serverDetailsDescription")}
      locale={params.locale as AppLocale}
      title={server.name}
    >
      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("serverLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{server.hostname}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("panelTypeLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {server.panel_type === "cpanel"
                  ? t("panelTypeCpanel")
                  : server.panel_type === "plesk"
                    ? t("panelTypePlesk")
                    : server.panel_type === "directadmin"
                      ? t("panelTypeDirectadmin")
                      : t("panelTypeCustom")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("serverStatusLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t(`serverStatus${server.status.charAt(0).toUpperCase()}${server.status.slice(1)}`)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("lastTestedLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {server.last_tested_at ?? t("neverTestedLabel")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("apiEndpointLabel")}</p>
              <p className="mt-2 break-all text-sm font-semibold text-foreground">
                {server.api_endpoint ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("credentialsLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {server.has_credentials ? t("credentialsConfigured") : t("credentialsMissing")}
              </p>
            </div>
          </div>

          {server.notes ? (
            <div className="mt-6 rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("notesLabel")}</p>
              <p className="mt-3 text-sm leading-7 text-foreground">{server.notes}</p>
            </div>
          ) : null}
        </article>

        <aside className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("testConnectionTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("testConnectionDescription")}</p>

          <div className="mt-6 rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
            <ServerConnectionTester
              serverId={server.id}
              buttonLabel={t("testConnectionButton")}
              runningLabel={t("testingConnection")}
              successLabel={t("testConnectionSuccess")}
              errorLabel={t("testConnectionError")}
            />
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("serverLoadLabel")}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {t("serverLoadSummary", {
                current: server.current_accounts,
                max: server.max_accounts ?? 0,
              })}
            </p>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("packageMappingsTitle")}</h2>
          {server.packages && server.packages.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {server.packages.map((pkg) => (
                <div key={pkg.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                  <p className="text-sm font-semibold text-foreground">
                    {pkg.display_name ?? pkg.panel_package_name}
                  </p>
                  <p className="mt-2 text-sm text-muted">{pkg.product?.name ?? t("notAvailable")}</p>
                  <p className="mt-2 text-sm text-muted">{pkg.panel_package_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("packageMappingsEmpty")}</p>
          )}
        </article>

        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("linkedServicesTitle")}</h2>
          {server.services && server.services.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {server.services.map((service) => (
                <div key={service.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                  <p className="text-sm font-semibold text-foreground">{service.reference_number}</p>
                  <p className="mt-2 text-sm text-muted">{service.domain ?? t("notAvailable")}</p>
                  <div className="mt-4">
                    <Link
                      className="rounded-full border border-line bg-[#faf9f5] px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                      href={localePath(params.locale, `/dashboard/services/${service.id}`)}
                    >
                      {t("viewServiceButton")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("linkedServicesEmpty")}</p>
          )}
        </article>
      </section>

      {server.panel_type === "plesk" ? (
        <PleskSubscriptionImporter
          serverId={server.id}
          locale={params.locale}
          initialPreview={pleskPreview?.data ?? []}
          products={productsResponse?.data ?? []}
          clients={clientsResponse?.data ?? []}
          strings={{
            title: t("importTitle"),
            description: t("importDescription"),
            refreshButton: t("importRefreshButton"),
            refreshingButton: t("importRefreshingButton"),
            importButton: t("importButton"),
            importingButton: t("importingButton"),
            searchLabel: t("searchLabel"),
            searchPlaceholder: t("importSearchPlaceholder"),
            subscriptionLabel: t("importSubscriptionLabel"),
            usernameLabel: t("usernameLabel"),
            planLabel: t("importPlanLabel"),
            statusLabel: t("serviceStatusLabel"),
            emailLabel: t("importEmailLabel"),
            usageLabel: t("importUsageLabel"),
            productLabel: t("productLabel"),
            clientLabel: t("clientLabel"),
            autoClientOption: t("importAutoClientOption"),
            selectProductPlaceholder: t("importSelectProductPlaceholder"),
            selectClientPlaceholder: t("importSelectClientPlaceholder"),
            companyNameLabel: t("importCompanyNameLabel"),
            countryLabel: t("importCountryLabel"),
            existingServiceLabel: t("importExistingServiceLabel"),
            existingClientLabel: t("importExistingClientLabel"),
            noSubscriptions: t("importEmpty"),
            importSuccess: t("importSuccess"),
            importError: t("importError"),
            refreshError: t("importRefreshError"),
            noSelectionError: t("importNoSelectionError"),
            alreadyImported: t("importAlreadyImported"),
            productRequired: t("importProductRequired"),
          }}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("recentJobsTitle")}</h2>
          {server.provisioning_jobs && server.provisioning_jobs.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {server.provisioning_jobs.map((job) => (
                <div key={job.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{operationLabel(job.operation)}</p>
                      <p className="mt-2 text-sm text-muted">
                        {t(`jobStatus${job.status.charAt(0).toUpperCase()}${job.status.slice(1)}`)}
                      </p>
                    </div>

                    {job.status === "failed" ? (
                      <ProvisioningJobRetryButton
                        jobId={job.id}
                        buttonLabel={t("retryJobButton")}
                        runningLabel={t("retryingJob")}
                        successLabel={t("retryJobSuccess")}
                        errorLabel={t("retryJobError")}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("recentJobsEmpty")}</p>
          )}
        </article>

        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("recentLogsTitle")}</h2>
          {server.provisioning_logs && server.provisioning_logs.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {server.provisioning_logs.map((log) => (
                <div key={log.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                  <p className="text-sm font-semibold text-foreground">{operationLabel(log.operation)}</p>
                  <p className="mt-2 text-sm text-muted">{log.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">
                    {log.occurred_at ?? t("notAvailable")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("recentLogsEmpty")}</p>
          )}
        </article>
      </section>
    </DashboardShell>
  );
}
