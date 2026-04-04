import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchPortalConfigFromCookies,
  fetchPortalContentBlocksFromCookies,
} from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function PortalWebsiteSecurityPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const cookieHeader = cookies().toString();
  const t = await getTranslations("Portal");
  const portalConfig = await fetchPortalConfigFromCookies(cookieHeader);
  const blocks =
    portalConfig?.surface.content_sources.website_security === false
      ? []
      : ((await fetchPortalContentBlocksFromCookies(cookieHeader, "client", {
          section: "website_security",
        })) ?? []);

  return (
    <PortalShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className={portalTheme.secondaryButtonClass}
            href={localePath(params.locale, "/portal/knowledgebase")}
          >
            {t("submenuKnowledgebase")}
          </Link>
          <Link
            className={portalTheme.primaryButtonClass}
            href={localePath(params.locale, "/portal/network-status")}
          >
            {t("submenuNetworkStatus")}
          </Link>
        </div>
      }
      currentPath="/portal/website-security"
      description={t("websiteSecurityPageDescription")}
      locale={params.locale as AppLocale}
      title={t("websiteSecurityPageTitle")}
    >
      {!Array.isArray(blocks) || blocks.length === 0 ? (
        <section className="space-y-4">
          <div className={portalTheme.noteClass}>{t("websiteSecurityEmptyStateNotice")}</div>
          <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
            <h2 className="text-xl font-semibold text-white">{t("websiteSecurityPageTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-[#aebad4]">
              {portalConfig?.surface.content_sources.website_security === false
                ? t("websiteSecurityKnowledgebaseDescription")
                : t("websiteSecurityNetworkStatusDescription")}
            </p>
          </article>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {blocks.map((block) => (
            <article
              key={block.id}
              className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}
            >
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.02em] text-white">
                {block.localized_title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#aebad4]">
                {block.localized_body}
              </p>
              {block.localized_cta_label && block.cta_href ? (
                <div className="mt-5">
                  <Link
                    className={portalTheme.secondaryButtonClass}
                    href={block.cta_href}
                  >
                    {block.localized_cta_label}
                  </Link>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </PortalShell>
  );
}
