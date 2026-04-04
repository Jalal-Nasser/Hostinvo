import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchNetworkIncidentsFromCookies,
  fetchPortalConfigFromCookies,
} from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

function formatDate(locale: string, value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function PortalNetworkStatusPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const cookieHeader = cookies().toString();
  const t = await getTranslations("Portal");
  const portalConfig = await fetchPortalConfigFromCookies(cookieHeader);
  const incidents =
    portalConfig?.surface.content_sources.network_status === false
      ? []
      : ((await fetchNetworkIncidentsFromCookies(cookieHeader, "client")) ?? []);

  return (
    <PortalShell
      actions={
        <Link
          className={portalTheme.primaryButtonClass}
          href={localePath(params.locale, "/portal/tickets/new")}
        >
          {t("contactSupportButton")}
        </Link>
      }
      currentPath="/portal/network-status"
      description={t("networkStatusPageDescription")}
      locale={params.locale as AppLocale}
      title={t("networkStatusPageTitle")}
    >
      {!Array.isArray(incidents) || incidents.length === 0 ? (
        <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <div className={[portalTheme.subtleSurfaceClass, "p-5 md:p-6"].join(" ")}>
            <h2 className="text-xl font-semibold text-white">{t("networkStatusFeedTitle")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
              {portalConfig?.surface.content_sources.network_status === false
                ? t("networkStatusFeedDescription")
                : t("networkStatusFeedDescription")}
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {incidents.map((incident) => (
            <article
              key={incident.id}
              className={[portalTheme.surfaceClass, "p-6"].join(" ")}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-[#8ea4ca]">
                <span>{incident.status}</span>
                <span>{incident.severity}</span>
              </div>
              <h2 className="mt-3 text-[1.3rem] font-semibold tracking-[-0.02em] text-white">
                {incident.localized_title}
              </h2>
              {incident.localized_summary ? (
                <p className="mt-3 text-sm leading-7 text-[#aebad4]">
                  {incident.localized_summary}
                </p>
              ) : null}
              {incident.localized_details ? (
                <div className="mt-4 rounded-[12px] bg-[rgba(255,255,255,0.03)] ps-4 pe-4 py-4 text-sm leading-7 text-[#d8e3f8]">
                  {incident.localized_details}
                </div>
              ) : null}
              <div className="mt-4 grid gap-1 text-sm text-[#aebad4]">
                {incident.started_at ? (
                  <p>{formatDate(params.locale, incident.started_at)}</p>
                ) : null}
                {incident.resolved_at ? (
                  <p>{formatDate(params.locale, incident.resolved_at)}</p>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </PortalShell>
  );
}
