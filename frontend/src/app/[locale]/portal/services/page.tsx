import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { PortalPagination } from "@/components/portal/portal-pagination";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchServicesFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

function formatDate(locale: string, value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function serviceStatusLabel(status: string, t: (key: string) => string): string {
  const key = `serviceStatus${status.charAt(0).toUpperCase()}${status.slice(1)}`;

  return t(key);
}

export default async function PortalServicesPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { search?: string; status?: string; page?: string };
}>) {
  setRequestLocale(params.locale);

  const [portalT, provisioningT] = await Promise.all([
    getTranslations("Portal"),
    getTranslations("Provisioning"),
  ]);
  const servicesResponse = await fetchServicesFromCookies(
    cookies().toString(),
    {
      page: searchParams?.page,
      search: searchParams?.search,
      status: searchParams?.status,
    },
    "client",
  );
  const services = servicesResponse?.data ?? [];
  const servicesMeta = servicesResponse?.meta;

  return (
    <PortalShell
      currentPath="/portal/services"
      description={portalT("portalServicesPageDescription")}
      locale={params.locale as AppLocale}
      title={portalT("servicesPageTitle")}
    >
      <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
        <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-[#dfe7f7]">
            <span>{provisioningT("searchLabel")}</span>
            <input
              className={portalTheme.fieldClass}
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={provisioningT("servicesSearchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[#dfe7f7]">
            <span>{provisioningT("serviceStatusLabel")}</span>
            <select
              className={portalTheme.fieldClass}
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{provisioningT("allServiceStatuses")}</option>
              {["pending", "provisioning", "active", "suspended", "terminated", "failed"].map((status) => (
                <option key={status} value={status}>
                  {serviceStatusLabel(status, provisioningT)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button className={portalTheme.primaryButtonClass} type="submit">
              {provisioningT("searchButton")}
            </button>
            <Link
              className={portalTheme.secondaryButtonClass}
              href={localePath(params.locale, "/portal/services")}
            >
              {provisioningT("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {services.length === 0 ? (
        <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <h2 className="text-xl font-semibold text-white">
            {portalT("portalServicesEmptyTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aebad4]">
            {portalT("portalServicesEmptyDescription")}
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          <section className="grid gap-4">
            {services.map((service) => (
              <article
                key={service.id}
                className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-white">
                        {service.domain ?? service.reference_number}
                      </h2>
                      <span className="rounded-full bg-[rgba(52,134,255,0.12)] ps-3 pe-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#dfe9ff]">
                        {serviceStatusLabel(service.status, provisioningT)}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-[#aebad4] md:grid-cols-2 xl:grid-cols-4">
                      <p>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                          {provisioningT("productLabel")}
                        </span>
                        <span className="mt-2 block font-semibold text-white">
                          {service.product?.name ??
                            service.server_package?.display_name ??
                            service.server_package?.panel_package_name ??
                            portalT("notAvailable")}
                        </span>
                      </p>
                      <p>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                          {provisioningT("usernameLabel")}
                        </span>
                        <span className="mt-2 block font-semibold text-white">
                          {service.username ?? portalT("notAvailable")}
                        </span>
                      </p>
                      <p>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                          {portalT("serviceNextDueDateLabel")}
                        </span>
                        <span className="mt-2 block font-semibold text-white">
                          {formatDate(params.locale, service.next_due_date) ?? portalT("notAvailable")}
                        </span>
                      </p>
                      <p>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                          {portalT("serviceReferenceLabel")}
                        </span>
                        <span className="mt-2 block font-semibold text-white">
                          {service.reference_number}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      className={portalTheme.secondaryButtonClass}
                      href={localePath(params.locale, `/portal/services/${service.id}`)}
                    >
                      {portalT("viewServiceButton")}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {servicesMeta ? (
            <PortalPagination
              currentPage={servicesMeta.current_page}
              lastPage={servicesMeta.last_page}
              locale={params.locale}
              nextLabel={portalT("paginationNext")}
              path="/portal/services"
              previousLabel={portalT("paginationPrevious")}
              query={{
                page: searchParams?.page,
                search: searchParams?.search,
                status: searchParams?.status,
              }}
              summaryLabel={portalT("paginationSummary")}
              total={servicesMeta.total}
            />
          ) : null}
        </div>
      )}
    </PortalShell>
  );
}
