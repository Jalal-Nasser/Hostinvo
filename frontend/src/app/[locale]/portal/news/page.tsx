import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalNewsPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Portal");

  return (
    <PortalShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/network-status")}>
            {t("viewNetworkStatusButton")}
          </Link>
          <Link className={portalTheme.primaryButtonClass} href={localePath(params.locale, "/portal/tickets/new")}>
            {t("contactSupportButton")}
          </Link>
        </div>
      }
      currentPath="/portal/news"
      description={t("newsPageDescription")}
      locale={params.locale as AppLocale}
      title={t("newsPageTitle")}
    >
      <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
        <div className={[portalTheme.subtleSurfaceClass, "p-5 md:p-6"].join(" ")}>
          <h2 className="text-xl font-semibold text-white">{t("newsPageEmptyTitle")}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
            {t("newsPageEmptyDescription")}
          </p>
        </div>
      </section>
    </PortalShell>
  );
}
