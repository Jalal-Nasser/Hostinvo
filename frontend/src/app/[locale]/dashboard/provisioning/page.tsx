import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProvisioningJobsFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function ProvisioningPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: {
    search?: string;
    status?: string;
    operation?: string;
    page?: string;
  };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Provisioning");
  const response = await fetchProvisioningJobsFromCookies(cookies().toString(), {
    search: searchParams?.search,
    status: searchParams?.status,
    operation: searchParams?.operation,
    page: searchParams?.page,
  });

  const jobs = response?.data ?? [];

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/services")}
          className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
        >
          {t("servicesTitle")}
        </Link>
      }
      currentPath="/dashboard/provisioning"
      description={t("jobsDescription")}
      locale={params.locale as AppLocale}
      title={t("jobsTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("searchLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("jobsSearchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("jobStatusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allJobStatuses")}</option>
              <option value="queued">{t("jobStatusQueued")}</option>
              <option value="processing">{t("jobStatusProcessing")}</option>
              <option value="completed">{t("jobStatusCompleted")}</option>
              <option value="failed">{t("jobStatusFailed")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("operationLabelText")}</span>
            <select
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.operation ?? ""}
              name="operation"
            >
              <option value="">{t("allOperations")}</option>
              <option value="create_account">{t("operationCreateAccount")}</option>
              <option value="suspend_account">{t("operationSuspendAccount")}</option>
              <option value="unsuspend_account">{t("operationUnsuspendAccount")}</option>
              <option value="terminate_account">{t("operationTerminateAccount")}</option>
              <option value="change_package">{t("operationChangePackage")}</option>
              <option value="reset_password">{t("operationResetPassword")}</option>
              <option value="sync_usage">{t("operationSyncUsage")}</option>
              <option value="sync_service_status">{t("operationSyncServiceStatus")}</option>
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
              href={localePath(params.locale, "/dashboard/provisioning")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {jobs.length === 0 ? (
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("jobsEmptyTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("jobsEmptyDescription")}</p>
        </section>
      ) : (
        <section className="grid gap-4">
          {jobs.map((job) => {
            const resultMessage =
              typeof job.result_payload?.message === "string"
                ? job.result_payload.message
                : null;

            return (
              <article key={job.id} className="glass-card p-6 md:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-foreground">{t(`operationLabel.${job.operation}`)}</h2>
                      <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        {t(`jobStatus${job.status.charAt(0).toUpperCase()}${job.status.slice(1)}`)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted">{job.service?.reference_number ?? t("notAvailable")}</p>
                    <p className="mt-2 text-sm text-muted">{job.server?.hostname ?? t("notAvailable")}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {job.service?.id ? (
                      <Link
                        className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                        href={localePath(params.locale, `/dashboard/services/${job.service.id}`)}
                      >
                        {t("viewServiceButton")}
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-line bg-white/80 p-5">
                  <p className="text-sm text-muted">
                    {job.error_message ?? resultMessage ?? t("jobPlaceholderMessage")}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </DashboardShell>
  );
}
