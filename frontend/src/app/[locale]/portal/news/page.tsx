import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchAnnouncementsFromCookies,
  fetchPortalConfigFromCookies,
} from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

function formatDate(locale: string, value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default async function PortalNewsPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const cookieHeader = cookies().toString();
  const t = await getTranslations("Portal");
  const portalConfig = await fetchPortalConfigFromCookies(cookieHeader);
  const announcements =
    portalConfig?.surface.content_sources.announcements === false
      ? []
      : ((await fetchAnnouncementsFromCookies(cookieHeader, {}, "client")) ?? []);

  return (
    <PortalShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className={portalTheme.secondaryButtonClass}
            href={localePath(params.locale, "/portal/network-status")}
          >
            {t("viewNetworkStatusButton")}
          </Link>
          <Link
            className={portalTheme.primaryButtonClass}
            href={localePath(params.locale, "/portal/tickets/new")}
          >
            {t("contactSupportButton")}
          </Link>
        </div>
      }
      currentPath="/portal/news"
      description={t("newsPageDescription")}
      locale={params.locale as AppLocale}
      title={t("newsPageTitle")}
    >
      {!Array.isArray(announcements) || announcements.length === 0 ? (
        <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <div className={[portalTheme.subtleSurfaceClass, "p-5 md:p-6"].join(" ")}>
            <h2 className="text-xl font-semibold text-white">{t("newsPageEmptyTitle")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
              {portalConfig?.surface.content_sources.announcements === false
                ? t("newsEmptyDescription")
                : t("newsPageEmptyDescription")}
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-4">
          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}
            >
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#8ea4ca]">
                <span>{announcement.status}</span>
                {announcement.published_at ? (
                  <span>{formatDate(params.locale, announcement.published_at)}</span>
                ) : null}
              </div>
              <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.02em] text-white">
                {announcement.localized_title}
              </h2>
              {announcement.localized_excerpt ? (
                <p className="mt-4 text-sm leading-7 text-[#aebad4]">
                  {announcement.localized_excerpt}
                </p>
              ) : null}
              <div className="mt-4 rounded-[12px] bg-[rgba(255,255,255,0.03)] ps-5 pe-5 py-5">
                <p className="text-sm leading-7 text-[#d8e3f8]">
                  {announcement.localized_body}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </PortalShell>
  );
}
