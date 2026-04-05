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
import { type AppLocale } from "@/i18n/routing";
import {
  canAccessClientPortal,
  defaultWorkspacePath,
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
  const user = await getAuthenticatedUserFromCookies(cookieHeader);

  if (!user) {
    redirect(localePath(locale, "/auth/login"));
  }

  if (!canAccessClientPortal(user)) {
    redirect(defaultWorkspacePath(locale, user));
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
  const hasActiveDesktopFlyout = activeSection.items.length > 0;
  const footerColumns = portalConfig?.surface.content_sources.footer_links === false
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

      <div
        className={[
          "relative min-h-screen",
          hasActiveDesktopFlyout ? "lg:ps-[360px]" : "lg:ps-[132px]",
        ].join(" ")}
      >
        <div className="ms-auto me-auto flex min-h-screen w-full max-w-[1360px] flex-col ps-4 pe-4 pt-4 pb-8 md:ps-6 md:pe-6 md:pt-5 lg:ps-8 lg:pe-8 xl:ps-10 xl:pe-10">
          <PortalTopbar locale={locale} t={t} user={user} branding={branding} />

          <div className="mb-5 space-y-4 lg:hidden">
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
                "mb-7 ps-6 pe-6 py-6 md:ps-7 md:pe-7 md:py-7",
              ].join(" ")}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className={portalTheme.sectionKickerClass}>
                    {activeSection.title}
                  </p>
                  <h1 className="mt-2 text-[1.85rem] font-semibold tracking-[-0.03em] text-white">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
                    {description}
                  </p>
                </div>

                {actions ? (
                  <div className="flex flex-wrap items-center gap-3">{actions}</div>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="flex-1 space-y-8">{children}</div>

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
