import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchServicesFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function ServicesPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: {
    search?: string;
    status?: string;
    provisioning_state?: string;
    page?: string;
  };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Provisioning");
  const response = await fetchServicesFromCookies(cookies().toString(), {
    search: searchParams?.search,
    status: searchParams?.status,
    provisioning_state: searchParams?.provisioning_state,
    page: searchParams?.page,
  });

  const services = response?.data ?? [];

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href={localePath(params.locale, "/dashboard/services/new")}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            {t("newServiceButton")}
          </Link>
          <Link
            href={localePath(params.locale, "/dashboard/provisioning")}
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          >
            {t("jobsTitle")}
          </Link>
        </div>
      }
      currentPath="/dashboard/services"
      description={t("servicesDescription")}
      locale={params.locale as AppLocale}
      title={t("servicesTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("searchLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("servicesSearchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("serviceStatusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allServiceStatuses")}</option>
              <option value="pending">{t("serviceStatusPending")}</option>
              <option value="provisioning">{t("serviceStatusProvisioning")}</option>
              <option value="active">{t("serviceStatusActive")}</option>
              <option value="suspended">{t("serviceStatusSuspended")}</option>
              <option value="terminated">{t("serviceStatusTerminated")}</option>
              <option value="failed">{t("serviceStatusFailed")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("provisioningStateLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.provisioning_state ?? ""}
              name="provisioning_state"
            >
              <option value="">{t("allProvisioningStates")}</option>
              <option value="idle">{t("provisioningStateIdle")}</option>
              <option value="queued">{t("provisioningStateQueued")}</option>
              <option value="processing">{t("provisioningStateProcessing")}</option>
              <option value="placeholder">{t("provisioningStatePlaceholder")}</option>
              <option value="synced">{t("provisioningStateSynced")}</option>
              <option value="failed">{t("provisioningStateFailed")}</option>
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
              href={localePath(params.locale, "/dashboard/services")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {services.length === 0 ? (
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("servicesEmptyTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("servicesEmptyDescription")}</p>
        </section>
      ) : (
        <section className="grid gap-4">
          {services.map((service) => (
            <article key={service.id} className="glass-card p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">{service.reference_number}</h2>
                    <span className="rounded-full border border-line bg-[#faf9f5]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {t(`serviceStatus${service.status.charAt(0).toUpperCase()}${service.status.slice(1)}`)}
                    </span>
                    <span className="rounded-full border border-line bg-[#fffdf8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {t(
                        `provisioningState${service.provisioning_state.charAt(0).toUpperCase()}${service.provisioning_state.slice(1)}`,
                      )}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">{service.client?.display_name ?? t("notAvailable")}</p>
                  <p className="mt-2 text-sm text-muted">{service.product?.name ?? t("notAvailable")}</p>
                  <p className="mt-2 text-sm text-muted">{service.domain ?? service.server?.hostname ?? t("notAvailable")}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/dashboard/services/${service.id}`)}
                  >
                    {t("viewServiceButton")}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
