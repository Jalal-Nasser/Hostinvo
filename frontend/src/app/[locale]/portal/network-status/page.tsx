import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalNetworkStatusPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Portal");

  const statusItems = [
    {
      key: "portal",
      title: t("networkStatusItemPortal"),
      description: t("networkStatusItemPortalDescription"),
    },
    {
      key: "api",
      title: t("networkStatusItemApi"),
      description: t("networkStatusItemApiDescription"),
    },
    {
      key: "mail",
      title: t("networkStatusItemMail"),
      description: t("networkStatusItemMailDescription"),
    },
  ];

  return (
    <PortalShell
      actions={
        <Link className={portalTheme.primaryButtonClass} href={localePath(params.locale, "/portal/tickets/new")}>
          {t("contactSupportButton")}
        </Link>
      }
      currentPath="/portal/network-status"
      description={t("networkStatusPageDescription")}
      locale={params.locale as AppLocale}
      title={t("networkStatusPageTitle")}
    >
      <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
        <div className="grid gap-4 md:grid-cols-3">
          {statusItems.map((item) => (
            <article key={item.key} className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-white">{item.title}</h2>
                <span className="rounded-full bg-[rgba(83,110,151,0.22)] ps-3 pe-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3def2]">
                  {t("networkStatusPendingLabel")}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#aebad4]">{item.description}</p>
            </article>
          ))}
        </div>

        <div className={[portalTheme.subtleSurfaceClass, "mt-5 p-5"].join(" ")}>
          <h3 className="text-lg font-semibold text-white">{t("networkStatusFeedTitle")}</h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
            {t("networkStatusFeedDescription")}
          </p>
        </div>
      </section>
    </PortalShell>
  );
}
