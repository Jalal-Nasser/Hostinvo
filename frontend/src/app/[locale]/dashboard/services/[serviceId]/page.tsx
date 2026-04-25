import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ServiceOperationPanel } from "@/components/provisioning/service-operation-panel";
import { ServiceDuplicateButton } from "@/components/provisioning/service-duplicate-button";
import { ProvisioningJobRetryButton } from "@/components/provisioning/provisioning-job-retry-button";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchServiceFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function ServiceDetailsPage({
  params,
}: Readonly<{
  params: { locale: string; serviceId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Provisioning");
  const supportT = await getTranslations("Support");
  const service = await fetchServiceFromCookies(cookies().toString(), params.serviceId);

  if (!service) {
    notFound();
  }

  const operations = [
    { value: "create_account", label: t("operationCreateAccount") },
    { value: "suspend_account", label: t("operationSuspendAccount") },
    { value: "unsuspend_account", label: t("operationUnsuspendAccount") },
    { value: "terminate_account", label: t("operationTerminateAccount") },
    { value: "change_package", label: t("operationChangePackage") },
    { value: "reset_password", label: t("operationResetPassword") },
    { value: "sync_usage", label: t("operationSyncUsage") },
    { value: "sync_service_status", label: t("operationSyncServiceStatus") },
  ] as const;

  function operationLabel(operation: string) {
    const match = operations.find((entry) => entry.value === operation);

    if (match) {
      return match.label;
    }

    if (operation === "test_connection") {
      return t("operationTestConnection");
    }

    return operation;
  }

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            href={localePath(params.locale, `/dashboard/tickets/new?service_id=${service.id}`)}
          >
            {supportT("newTicketButton")}
          </Link>
          {service.server?.id ? (
            <Link
              className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
              href={localePath(params.locale, `/dashboard/servers/${service.server.id}`)}
            >
              {t("viewServerButton")}
            </Link>
          ) : null}
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, `/dashboard/services/${service.id}/edit`)}
          >
            {t("editServiceButton")}
          </Link>
          <ServiceDuplicateButton serviceId={service.id} />
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, "/dashboard/services")}
          >
            {t("backToServicesButton")}
          </Link>
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, "/dashboard/provisioning")}
          >
            {t("jobsTitle")}
          </Link>
        </div>
      }
      currentPath={`/dashboard/services/${service.id}`}
      description={t("serviceDetailsDescription")}
      locale={params.locale as AppLocale}
      title={service.reference_number}
    >
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("clientLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {service.client?.display_name ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("productLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {service.product?.name ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("serviceStatusLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t(`serviceStatus${service.status.charAt(0).toUpperCase()}${service.status.slice(1)}`)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("provisioningStateLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t(
                  `provisioningState${service.provisioning_state.charAt(0).toUpperCase()}${service.provisioning_state.slice(1)}`,
                )}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("domainLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{service.domain ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("serverLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {service.server ? `${service.server.name} (${service.server.hostname})` : t("notAvailable")}
              </p>
            </div>
          </div>

          {service.notes ? (
            <div className="mt-6 rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("notesLabel")}</p>
              <p className="mt-3 text-sm leading-7 text-foreground">{service.notes}</p>
            </div>
          ) : null}
        </article>

        <aside className="glass-card p-6 md:p-8">
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("billingCycleLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{t(`billingCycle.${service.billing_cycle}`)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("usernameLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{service.username ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("panelUrlLabel")}</p>
              <p className="mt-2 break-all text-sm font-semibold text-foreground">
                {service.credentials?.control_panel_url ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#fffdf8] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("accessUrlLabel")}</p>
              <p className="mt-2 break-all text-sm font-semibold text-foreground">
                {service.credentials?.access_url ?? t("notAvailable")}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <ServiceOperationPanel
        serviceId={service.id}
        operations={operations}
        title={t("operationsTitle")}
        description={t("operationsDescription")}
        runningLabel={t("dispatchingOperation")}
        successLabel={t("operationQueuedSuccess")}
        errorLabel={t("operationQueuedError")}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("usageTitle")}</h2>
          {service.usage ? (
            <div className="mt-6 grid gap-4">
              <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("diskUsageLabel")}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {service.usage.disk_used_mb} / {service.usage.disk_limit_mb} MB
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("bandwidthUsageLabel")}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {service.usage.bandwidth_used_mb} / {service.usage.bandwidth_limit_mb} MB
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("usageEmpty")}</p>
          )}
        </article>

        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("logsTitle")}</h2>
          {service.provisioning_logs && service.provisioning_logs.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {service.provisioning_logs.slice(0, 6).map((log) => (
                <div key={log.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-sm font-semibold text-foreground">{operationLabel(log.operation)}</p>
                  <p className="mt-2 text-sm text-muted">{log.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("logsEmpty")}</p>
          )}
        </article>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("jobsTitle")}</h2>
        {service.provisioning_jobs && service.provisioning_jobs.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {service.provisioning_jobs.map((job) => (
              <article key={job.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{operationLabel(job.operation)}</p>
                    <p className="mt-2 text-sm text-muted">
                      {t(`jobStatus${job.status.charAt(0).toUpperCase()}${job.status.slice(1)}`)}
                    </p>
                  </div>
                  <div className="grid gap-3 md:justify-items-end">
                    <p className="text-sm text-muted">{job.requested_at ?? t("notAvailable")}</p>
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
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">{t("jobsEmpty")}</p>
        )}
      </section>
    </DashboardShell>
  );
}
