import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchServiceFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

function formatDate(locale: string, value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(new Date(value));
}

function serviceStatusLabel(status: string, t: (key: string) => string): string {
  const key = `serviceStatus${status.charAt(0).toUpperCase()}${status.slice(1)}`;

  return t(key);
}

function provisioningStateLabel(state: string, t: (key: string) => string): string {
  const key = `provisioningState${state.charAt(0).toUpperCase()}${state.slice(1)}`;

  return t(key);
}

export default async function PortalServiceDetailsPage({
  params,
}: Readonly<{
  params: { locale: string; serviceId: string };
}>) {
  setRequestLocale(params.locale);

  const [portalT, provisioningT] = await Promise.all([
    getTranslations("Portal"),
    getTranslations("Provisioning"),
  ]);
  const service = await fetchServiceFromCookies(
    cookies().toString(),
    params.serviceId,
    "client",
  );

  if (!service) {
    notFound();
  }

  return (
    <PortalShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className={portalTheme.primaryButtonClass}
            href={localePath(params.locale, `/portal/tickets/new?service_id=${service.id}`)}
          >
            {portalT("openSupportTicketButton")}
          </Link>
          <Link
            className={portalTheme.secondaryButtonClass}
            href={localePath(params.locale, "/portal/services")}
          >
            {portalT("backToServicesButton")}
          </Link>
        </div>
      }
      currentPath={`/portal/services/${service.id}`}
      description={portalT("portalServiceDetailsDescription")}
      locale={params.locale as AppLocale}
      title={service.domain ?? service.reference_number}
    >
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {provisioningT("serviceStatusLabel")}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {serviceStatusLabel(service.status, provisioningT)}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {provisioningT("provisioningStateLabel")}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {provisioningStateLabel(service.provisioning_state, provisioningT)}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {provisioningT("domainLabel")}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {service.domain ?? portalT("notAvailable")}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {provisioningT("usernameLabel")}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {service.username ?? portalT("notAvailable")}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {provisioningT("productLabel")}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {service.product?.name ??
                  service.server_package?.display_name ??
                  service.server_package?.panel_package_name ??
                  portalT("notAvailable")}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {portalT("serviceNextDueDateLabel")}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {formatDate(params.locale, service.next_due_date) ?? portalT("notAvailable")}
              </p>
            </div>
          </div>

          {service.notes ? (
            <div className={[portalTheme.subtleSurfaceClass, "mt-5 p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {provisioningT("notesLabel")}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#d8e3f9]">
                {service.notes}
              </p>
            </div>
          ) : null}
        </article>

        <aside className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <div className="grid gap-4">
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {provisioningT("serverLabel")}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {service.server
                  ? `${service.server.name} (${service.server.hostname})`
                  : portalT("notAvailable")}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {portalT("servicePackageLabel")}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {service.server_package?.display_name ??
                  service.server_package?.panel_package_name ??
                  portalT("notAvailable")}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {provisioningT("panelUrlLabel")}
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-white">
                {service.credentials?.control_panel_url ?? portalT("notAvailable")}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {provisioningT("accessUrlLabel")}
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-white">
                {service.credentials?.access_url ?? portalT("notAvailable")}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <h2 className="text-xl font-semibold text-white">{provisioningT("usageTitle")}</h2>
          {service.usage ? (
            <div className="mt-5 grid gap-3">
              <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                  {provisioningT("diskUsageLabel")}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {service.usage.disk_used_mb} / {service.usage.disk_limit_mb} MB
                </p>
              </div>
              <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                  {provisioningT("bandwidthUsageLabel")}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {service.usage.bandwidth_used_mb} / {service.usage.bandwidth_limit_mb} MB
                </p>
              </div>
              <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                  {portalT("serviceUsageAccountsLabel")}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {service.usage.email_accounts_used}
                </p>
              </div>
              <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                  {portalT("serviceUsageDatabasesLabel")}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {service.usage.databases_used}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-[#aebad4]">{provisioningT("usageEmpty")}</p>
          )}
        </article>

        <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <h2 className="text-xl font-semibold text-white">{portalT("serviceSupportTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aebad4]">
            {portalT("serviceSupportDescription")}
          </p>

          <div className="mt-5 grid gap-3">
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {portalT("serviceReferenceLabel")}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {service.reference_number}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {portalT("serviceRegisteredLabel")}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {formatDate(params.locale, service.registration_date) ?? portalT("notAvailable")}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Link
              className={portalTheme.primaryButtonClass}
              href={localePath(params.locale, `/portal/tickets/new?service_id=${service.id}`)}
            >
              {portalT("openSupportTicketButton")}
            </Link>
          </div>
        </article>
      </section>
    </PortalShell>
  );
}
