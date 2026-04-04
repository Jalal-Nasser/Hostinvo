import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalWebsiteSecurityPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Portal");

  const resources = [
    {
      key: "knowledgebase",
      title: t("submenuKnowledgebase"),
      description: t("websiteSecurityKnowledgebaseDescription"),
      href: localePath(params.locale, "/portal/knowledgebase"),
    },
    {
      key: "network-status",
      title: t("submenuNetworkStatus"),
      description: t("websiteSecurityNetworkStatusDescription"),
      href: localePath(params.locale, "/portal/network-status"),
    },
    {
      key: "news",
      title: t("submenuNews"),
      description: t("websiteSecurityNewsDescription"),
      href: localePath(params.locale, "/portal/news"),
    },
  ];

  return (
    <PortalShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/knowledgebase")}>
            {t("submenuKnowledgebase")}
          </Link>
          <Link className={portalTheme.primaryButtonClass} href={localePath(params.locale, "/portal/network-status")}>
            {t("submenuNetworkStatus")}
          </Link>
        </div>
      }
      currentPath="/portal/website-security"
      description={t("websiteSecurityPageDescription")}
      locale={params.locale as AppLocale}
      title={t("websiteSecurityPageTitle")}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {resources.map((resource) => (
          <article key={resource.key} className={[portalTheme.surfaceClass, "p-5"].join(" ")}>
            <h2 className="text-lg font-semibold text-white">{resource.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#aebad4]">{resource.description}</p>
            <div className="mt-5">
              <Link className={portalTheme.secondaryButtonClass} href={resource.href}>
                {t("openGuideButton")}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </PortalShell>
  );
}
