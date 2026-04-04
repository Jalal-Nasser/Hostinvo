import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalProductsPage({
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
          <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/domains/register")}>
            {t("productsBrowseDomainsButton")}
          </Link>
          <Link className={portalTheme.primaryButtonClass} href={localePath(params.locale, "/portal/tickets/new")}>
            {t("contactSupportButton")}
          </Link>
        </div>
      }
      currentPath="/portal/products"
      description={t("productsPageDescription")}
      locale={params.locale as AppLocale}
      title={t("productsPageTitle")}
    >
      <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
        <div className={[portalTheme.subtleSurfaceClass, "p-5 md:p-6"].join(" ")}>
          <h2 className="text-xl font-semibold text-white">{t("productsEmptyTitle")}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">{t("productsEmptyDescription")}</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
            <h3 className="text-lg font-semibold text-white">{t("productsProvisioningHelpTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-[#aebad4]">{t("productsProvisioningHelpDescription")}</p>
            <div className="mt-5">
              <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/tickets/new")}>
                {t("contactSupportButton")}
              </Link>
            </div>
          </article>

          <article className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
            <h3 className="text-lg font-semibold text-white">{t("productsDomainOptionsTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-[#aebad4]">{t("productsDomainOptionsDescription")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className={portalTheme.primaryButtonClass} href={localePath(params.locale, "/portal/domains/register")}>
                {t("registerDomainButton")}
              </Link>
              <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/domains/pricing")}>
                {t("productsPricingButton")}
              </Link>
            </div>
          </article>
        </div>
      </section>
    </PortalShell>
  );
}
