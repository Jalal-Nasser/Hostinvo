import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { PortalDesktopNav } from "@/components/portal/portal-desktop-nav";
import { PortalFlyoutMenu } from "@/components/portal/portal-flyout-menu";
import { PortalFooter } from "@/components/portal/portal-footer";
import {
  buildPortalFooterColumns,
  buildPortalSections,
  resolvePortalSectionKey,
} from "@/components/portal/portal-navigation";
import { PortalRailNav } from "@/components/portal/portal-rail-nav";
import {
  portalTheme,
  portalThemeVariables,
  resolvePortalHeaderCardClass,
} from "@/components/portal/portal-theme";
import { PortalTopbar } from "@/components/portal/portal-topbar";
import { DocumentTitle } from "@/components/shared/document-title";
import { type AppLocale } from "@/i18n/routing";
import {
  getAuthenticatedUserFromCookies,
  localePath,
} from "@/lib/auth";
import { fetchPortalConfigFromCookies } from "@/lib/tenant-admin";

type PortalShellProps = {
  locale: AppLocale;
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  showPageIntro?: boolean;
};

export async function PortalShell({
  locale,
  currentPath,
  title,
  description,
  children,
  actions,
  showPageIntro = true,
}: PortalShellProps) {
  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader, "/portal");

  if (!user) {
    redirect(localePath(locale, "/auth/login"));
  }

  const t = await getTranslations("Portal");
  const portalConfig = await fetchPortalConfigFromCookies(cookieHeader);
  const branding = portalConfig?.branding ?? null;
  const activeTenant = user.active_tenant ?? user.tenant ?? null;
  const sections = buildPortalSections(locale, t, portalConfig?.surface);
  const activeSectionKey = resolvePortalSectionKey(currentPath);
  const activeSection = sections.find((section) => section.key === activeSectionKey) ?? {
    key: "products",
    configKey: "products",
    label: t("railProducts"),
    title: t("productsSectionTitle"),
    description: t("productsSectionDescription"),
    href: localePath(locale, "/portal/products"),
    icon: "products" as const,
    items: [],
  };
  const footerColumns = portalConfig?.surface?.content_sources?.footer_links === false
    ? []
    : buildPortalFooterColumns(locale, t, portalConfig?.footer_links ?? []);
  const railLogoSrc = branding?.favicon_url || branding?.logo_url || null;
  const portalBrandName =
    branding?.portal_name?.trim() ||
    activeTenant?.name?.trim() ||
    (locale === "ar" ? "بوابة العملاء" : "Client portal");

  return (
    <main
      className={["portal-workspace min-h-screen text-foreground", portalTheme.pageBackgroundClass].join(" ")}
      style={portalThemeVariables}
    >
      <DocumentTitle brand={portalBrandName} title={title} />
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 z-30" style={{ insetInlineStart: 0 }}>
          <PortalDesktopNav
            activeSectionKey={activeSectionKey}
            currentPath={currentPath}
            locale={locale}
            sections={sections}
            logoSrc={railLogoSrc}
            logoAlt={portalBrandName}
          />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col lg:ps-[104px]">
        <PortalTopbar locale={locale} t={t} user={user} branding={branding} />

        <div className="ms-auto me-auto flex min-h-0 w-full flex-1 flex-col ps-4 pe-4 pt-0 pb-8 md:ps-6 md:pe-6 lg:ps-0 lg:pe-0">
          <div className="mb-5 space-y-4 px-0 pt-4 lg:hidden">
            <PortalRailNav
              activeSectionKey={activeSectionKey}
              locale={locale}
              mobile
              sections={sections}
              logoSrc={railLogoSrc}
              logoAlt={portalBrandName}
            />
            {activeSection.items.length > 0 ? (
              <PortalFlyoutMenu
                currentPath={currentPath}
                locale={locale}
                mobile
                section={activeSection}
                branding={{
                  logoUrl: branding?.logo_url,
                  portalName: branding?.portal_name,
                }}
              />
            ) : null}
          </div>

          {showPageIntro ? (
            <section
              className={[
                resolvePortalHeaderCardClass(activeSection.key),
                "mx-4 mb-6 mt-5 px-6 py-6 md:mx-6 md:px-7 md:py-7 lg:mx-6",
              ].join(" ")}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className={portalTheme.sectionKickerClass}>
                    {activeSection.title}
                  </p>
                  <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.028em] text-white md:text-[2rem]">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-3xl text-[13.5px] leading-6 text-[#c1cce3]">
                    {description}
                  </p>
                </div>

                {actions ? (
                  <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="flex-1">{children}</div>

          <PortalFooter
            columns={footerColumns}
            currentPath={currentPath}
            locale={locale}
            t={t}
            branding={branding}
          />
        </div>
      </div>
    </main>
  );
}
