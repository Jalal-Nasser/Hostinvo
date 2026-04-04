import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { DomainHero } from "@/components/portal/domain-hero";
import { PortalNewsCard } from "@/components/portal/portal-news-card";
import { portalTheme } from "@/components/portal/portal-theme";
import { QuickActions } from "@/components/portal/quick-actions";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchAnnouncementsFromCookies,
  fetchKnowledgeBaseFromCookies,
  fetchNetworkIncidentsFromCookies,
  fetchPortalConfigFromCookies,
  localizedValue,
  type PortalSurfaceEntry,
} from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

type HomeSectionKey =
  | "domain_hero"
  | "quick_actions"
  | "announcements"
  | "knowledgebase"
  | "network_status";

type HomeCardKey =
  | "register_domain"
  | "transfer_domain"
  | "domain_pricing"
  | "support";

function defaultSectionEntries(): PortalSurfaceEntry[] {
  return [
    { key: "domain_hero", visible: true, order: 10, label_en: null, label_ar: null },
    { key: "quick_actions", visible: true, order: 20, label_en: null, label_ar: null },
    { key: "announcements", visible: true, order: 30, label_en: null, label_ar: null },
    { key: "knowledgebase", visible: true, order: 40, label_en: null, label_ar: null },
    { key: "network_status", visible: true, order: 50, label_en: null, label_ar: null },
  ];
}

function defaultCardEntries(): PortalSurfaceEntry[] {
  return [
    { key: "register_domain", visible: true, order: 10, label_en: null, label_ar: null },
    { key: "transfer_domain", visible: true, order: 20, label_en: null, label_ar: null },
    { key: "domain_pricing", visible: true, order: 30, label_en: null, label_ar: null },
    { key: "support", visible: true, order: 40, label_en: null, label_ar: null },
  ];
}

function resolveEntryLabel(
  locale: string,
  entry: PortalSurfaceEntry | undefined,
  fallback: string,
): string {
  if (!entry) {
    return fallback;
  }

  const localized = localizedValue(locale, entry.label_en, entry.label_ar);

  return localized || fallback;
}

function formatDate(locale: string, value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default async function PortalPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const cookieHeader = cookies().toString();
  const t = await getTranslations("Portal");
  const isRtl = params.locale === "ar";
  const portalConfig = await fetchPortalConfigFromCookies(cookieHeader);
  const surface = portalConfig?.surface;
  const sectionEntries = (surface?.home_sections ?? defaultSectionEntries())
    .filter((entry) => entry.visible)
    .sort((left, right) => left.order - right.order);
  const cardEntries = (surface?.home_cards ?? defaultCardEntries())
    .filter((entry) => entry.visible)
    .sort((left, right) => left.order - right.order);

  const contentSources = surface?.content_sources ?? {
    announcements: true,
    knowledgebase: true,
    network_status: true,
    website_security: true,
    footer_links: true,
  };

  const [announcementsResponse, knowledgebaseResponse, incidentsResponse] = await Promise.all([
    contentSources.announcements
      ? fetchAnnouncementsFromCookies(cookieHeader, {}, "client")
      : Promise.resolve([]),
    contentSources.knowledgebase
      ? fetchKnowledgeBaseFromCookies(cookieHeader, "client")
      : Promise.resolve(null),
    contentSources.network_status
      ? fetchNetworkIncidentsFromCookies(cookieHeader, "client")
      : Promise.resolve([]),
  ]);

  const announcements = Array.isArray(announcementsResponse)
    ? announcementsResponse
    : [];
  const knowledgebaseCategories =
    knowledgebaseResponse && Array.isArray(knowledgebaseResponse.categories)
      ? knowledgebaseResponse.categories
      : [];
  const featuredArticles = knowledgebaseCategories
    .flatMap((category) => category.articles ?? [])
    .slice(0, 4);
  const incidents = Array.isArray(incidentsResponse) ? incidentsResponse : [];

  const quickActions = cardEntries
    .map((entry) => {
      const key = entry.key as HomeCardKey;

      switch (key) {
        case "register_domain":
          return {
            key,
            label: resolveEntryLabel(params.locale, entry, t("quickActionBuyDomain")),
            description: t("quickActionBuyDomainDescription"),
            href: localePath(params.locale, "/portal/domains/register"),
            icon: "buy-domain" as const,
          };
        case "transfer_domain":
          return {
            key,
            label: resolveEntryLabel(params.locale, entry, t("quickActionTransferDomain")),
            description: t("quickActionTransferDomainDescription"),
            href: localePath(params.locale, "/portal/domains/transfer"),
            icon: "transfer-domain" as const,
          };
        case "domain_pricing":
          return {
            key,
            label: resolveEntryLabel(params.locale, entry, t("quickActionDomainPricing")),
            description: t("quickActionDomainPricingDescription"),
            href: localePath(params.locale, "/portal/domains/pricing"),
            icon: "domain-pricing" as const,
          };
        case "support":
          return {
            key,
            label: resolveEntryLabel(params.locale, entry, t("quickActionGetSupport")),
            description: t("quickActionGetSupportDescription"),
            href: localePath(params.locale, "/portal/tickets/new"),
            icon: "get-support" as const,
          };
        default:
          return null;
      }
    })
    .filter((action): action is NonNullable<typeof action> => Boolean(action));

  const sectionContent = new Map<HomeSectionKey, React.ReactNode>([
    [
      "domain_hero",
      <DomainHero
        key="domain_hero"
        description={t("heroDescription")}
        isRtl={isRtl}
        kicker={t("heroKicker")}
        placeholder={t("heroPlaceholder")}
        registerHref={localePath(params.locale, "/portal/domains/register")}
        searchLabel={t("heroSearchButton")}
        suggestedExtensionsLabel={t("heroSuggestedExtensions")}
        title={t("heroTitle")}
        transferHref={localePath(params.locale, "/portal/domains/transfer")}
        transferLabel={t("heroTransferButton")}
      />,
    ],
    [
      "quick_actions",
      quickActions.length > 0 ? (
        <QuickActions
          key="quick_actions"
          kicker={t("quickActionsKicker")}
          title={resolveEntryLabel(
            params.locale,
            sectionEntries.find((entry) => entry.key === "quick_actions"),
            t("quickActionsTitle"),
          )}
          actions={quickActions}
        />
      ) : null,
    ],
    [
      "announcements",
      contentSources.announcements ? (
        <PortalNewsCard
          key="announcements"
          description={t("newsDescription")}
          emptyDescription={t("newsEmptyDescription")}
          emptyTitle={t("newsEmptyTitle")}
          items={announcements.slice(0, 3).map((announcement) => ({
            id: announcement.id,
            title: announcement.localized_title,
            excerpt: announcement.localized_excerpt,
            publishedAt: formatDate(params.locale, announcement.published_at),
          }))}
          kicker={t("newsKicker")}
          title={resolveEntryLabel(
            params.locale,
            sectionEntries.find((entry) => entry.key === "announcements"),
            t("newsTitle"),
          )}
          viewAllHref={localePath(params.locale, "/portal/news")}
          viewAllLabel={t("submenuNews")}
        />
      ) : null,
    ],
    [
      "knowledgebase",
      contentSources.knowledgebase ? (
        <section key="knowledgebase" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className={portalTheme.sectionKickerClass}>{t("submenuKnowledgebase")}</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.02em] text-white">
                {resolveEntryLabel(
                  params.locale,
                  sectionEntries.find((entry) => entry.key === "knowledgebase"),
                  t("knowledgebasePageTitle"),
                )}
              </h2>
            </div>
            <Link
              className={portalTheme.secondaryButtonClass}
              href={localePath(params.locale, "/portal/knowledgebase")}
            >
              {t("openGuideButton")}
            </Link>
          </div>

          {featuredArticles.length === 0 ? (
            <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
              <h3 className="text-lg font-semibold text-white">{t("knowledgebaseEmptyTitle")}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
                {t("knowledgebasePublishedNote")}
              </p>
            </article>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {featuredArticles.map((article) => (
                <article
                  key={article.id}
                  className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8ea4ca]">
                    {article.category?.localized_name ?? t("knowledgebasePageTitle")}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {article.localized_title}
                  </h3>
                  {article.localized_excerpt ? (
                    <p className="mt-3 text-sm leading-7 text-[#aebad4]">
                      {article.localized_excerpt}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null,
    ],
    [
      "network_status",
      contentSources.network_status ? (
        <section key="network_status" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className={portalTheme.sectionKickerClass}>{t("submenuNetworkStatus")}</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.02em] text-white">
                {resolveEntryLabel(
                  params.locale,
                  sectionEntries.find((entry) => entry.key === "network_status"),
                  t("networkStatusPageTitle"),
                )}
              </h2>
            </div>
            <Link
              className={portalTheme.secondaryButtonClass}
              href={localePath(params.locale, "/portal/network-status")}
            >
              {t("viewNetworkStatusButton")}
            </Link>
          </div>

          {incidents.length === 0 ? (
            <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
              <h3 className="text-lg font-semibold text-white">{t("networkStatusFeedTitle")}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
                {t("networkStatusFeedDescription")}
              </p>
            </article>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {incidents.slice(0, 3).map((incident) => (
                <article
                  key={incident.id}
                  className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-[#8ea4ca]">
                      {incident.status}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-[#8ea4ca]">
                      {incident.severity}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {incident.localized_title}
                  </h3>
                  {incident.localized_summary ? (
                    <p className="mt-3 text-sm leading-7 text-[#aebad4]">
                      {incident.localized_summary}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null,
    ],
  ]);

  return (
    <PortalShell
      currentPath="/portal"
      description={t("overviewDescription")}
      locale={params.locale as AppLocale}
      showPageIntro={false}
      title={t("overviewTitle")}
    >
      {sectionEntries.map((entry) => sectionContent.get(entry.key as HomeSectionKey) ?? null)}
    </PortalShell>
  );
}
