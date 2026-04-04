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
        <div className={[portalTheme.subtleSurfaceClass, "p-5 md:p-6"].join(" ")}>
          <h2 className="text-xl font-semibold text-white">{t("networkStatusFeedTitle")}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
            {t("networkStatusFeedDescription")}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {["portal", "api", "mail"].map((item) => (
              <article key={item} className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                  {t(`networkStatusItem${item.charAt(0).toUpperCase()}${item.slice(1)}`)}
                </p>
                <p className="mt-3 text-sm leading-7 text-[#aebad4]">
                  {t(`networkStatusItem${item.charAt(0).toUpperCase()}${item.slice(1)}Description`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PortalShell>
  );
}
