import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { DomainHero } from "@/components/portal/domain-hero";
import {
  PortalKnowledgebasePreview,
  type PortalKnowledgebasePreviewItem,
} from "@/components/portal/portal-knowledgebase-preview";
import { PortalNewsCard } from "@/components/portal/portal-news-card";
import { QuickActions } from "@/components/portal/quick-actions";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchAnnouncementsFromCookies,
  fetchKnowledgeBaseFromCookies,
  fetchPortalConfigFromCookies,
  type PortalSurfaceEntry,
} from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

type HomeSectionKey =
  | "domain_hero"
  | "quick_actions"
  | "announcements"
  | "knowledgebase";
type HomeCardKey = "buy_domain" | "hosting" | "billing" | "support";

function defaultSectionEntries(): PortalSurfaceEntry[] {
  return [
    { key: "domain_hero", visible: true, order: 10, label_en: null, label_ar: null },
    { key: "quick_actions", visible: true, order: 20, label_en: null, label_ar: null },
    { key: "announcements", visible: true, order: 30, label_en: null, label_ar: null },
    { key: "knowledgebase", visible: true, order: 40, label_en: null, label_ar: null },
  ];
}

function defaultCardEntries(): PortalSurfaceEntry[] {
  return [
    { key: "buy_domain", visible: true, order: 10, label_en: null, label_ar: null },
    { key: "hosting", visible: true, order: 20, label_en: null, label_ar: null },
    { key: "billing", visible: true, order: 30, label_en: null, label_ar: null },
    { key: "support", visible: true, order: 40, label_en: null, label_ar: null },
  ];
}

function localizedEntryLabel(
  entry: PortalSurfaceEntry,
  locale: string,
  fallback: string,
): string {
  const label = locale === "ar" ? entry.label_ar : entry.label_en;

  return label?.trim() || fallback;
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
  const portalConfig = await fetchPortalConfigFromCookies(cookieHeader);
  const surface = portalConfig?.surface;
  const visibleSectionEntries = (surface?.home_sections ?? defaultSectionEntries())
    .filter((entry) => entry.visible)
    .sort((left, right) => left.order - right.order);
  const sectionEntries = visibleSectionEntries.length > 0
    ? visibleSectionEntries
    : defaultSectionEntries();

  const contentSources = surface?.content_sources ?? {
    announcements: true,
    knowledgebase: true,
    network_status: true,
    website_security: true,
    footer_links: true,
  };

  const announcementsResponse = contentSources.announcements
    ? await fetchAnnouncementsFromCookies(cookieHeader, {}, "client")
    : [];
  const announcements = Array.isArray(announcementsResponse)
    ? announcementsResponse
    : [];
  const knowledgebase = contentSources.knowledgebase
    ? await fetchKnowledgeBaseFromCookies(cookieHeader, "client")
    : null;
  const knowledgebaseCategories =
    knowledgebase && Array.isArray(knowledgebase.categories)
      ? knowledgebase.categories
      : [];
  const knowledgebaseItems: PortalKnowledgebasePreviewItem[] =
    knowledgebaseCategories.flatMap((category) =>
      (category.articles ?? []).map((article) => ({
        id: article.id,
        title: article.localized_title,
        excerpt: article.localized_excerpt,
        href: localePath(params.locale, "/portal/knowledgebase"),
      })),
    );

  const actionCatalog: Record<HomeCardKey, {
    description: string;
    fallbackLabel: string;
    href: string;
    icon: "buy-domain" | "order-hosting" | "make-payment" | "get-support";
  }> = {
    buy_domain: {
      description: t("quickActionBuyDomainDescription"),
      fallbackLabel: t("quickActionBuyDomain"),
      href: localePath(params.locale, "/portal/domains/register"),
      icon: "buy-domain" as const,
    },
    hosting: {
      description: t("quickActionOrderHostingDescription"),
      fallbackLabel: t("quickActionOrderHosting"),
      href: localePath(params.locale, "/portal/products"),
      icon: "order-hosting" as const,
    },
    billing: {
      description: t("quickActionBillingDescription"),
      fallbackLabel: t("quickActionBilling"),
      href: localePath(params.locale, "/portal/invoices"),
      icon: "make-payment" as const,
    },
    support: {
      description: t("quickActionGetSupportDescription"),
      fallbackLabel: t("quickActionGetSupport"),
      href: localePath(params.locale, "/portal/tickets/new"),
      icon: "get-support" as const,
    },
  };
  const visibleHomeCards = (surface?.home_cards ?? defaultCardEntries())
    .filter((entry) => entry.visible)
    .sort((left, right) => left.order - right.order);
  const homeCardEntries = visibleHomeCards.length > 0
    ? visibleHomeCards
    : defaultCardEntries();
  const quickActions = homeCardEntries.flatMap((entry) => {
    const config = actionCatalog[entry.key as HomeCardKey];

    if (!config) {
      return [];
    }

    return [{
      key: entry.key,
      label: localizedEntryLabel(entry, params.locale, config.fallbackLabel),
      description: config.description,
      href: config.href,
      icon: config.icon,
    }];
  });
  const fallbackAnnouncements = [
    {
      id: "starter-news-portal",
      title: t("newsFallbackPortalTitle"),
      excerpt: t("newsFallbackPortalDescription"),
      publishedAt: null,
    },
    {
      id: "starter-news-support",
      title: t("newsFallbackSupportTitle"),
      excerpt: t("newsFallbackSupportDescription"),
      publishedAt: null,
    },
  ];
  const fallbackKnowledgebaseItems: PortalKnowledgebasePreviewItem[] = [
    {
      id: "starter-kb-register",
      title: t("knowledgebaseTopicRegisterTitle"),
      excerpt: t("knowledgebaseTopicRegisterDescription"),
      href: localePath(params.locale, "/portal/domains/register"),
    },
    {
      id: "starter-kb-transfer",
      title: t("knowledgebaseTopicTransferTitle"),
      excerpt: t("knowledgebaseTopicTransferDescription"),
      href: localePath(params.locale, "/portal/domains/transfer"),
    },
    {
      id: "starter-kb-support",
      title: t("knowledgebaseTopicSupportTitle"),
      excerpt: t("knowledgebaseTopicSupportDescription"),
      href: localePath(params.locale, "/portal/tickets/new"),
    },
  ];

  const sectionContent = new Map<HomeSectionKey, React.ReactNode>([
    [
      "domain_hero",
      <DomainHero
        key="domain_hero"
        description={t("heroDescription")}
        isRtl={params.locale === "ar"}
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
      <QuickActions
        emptyDescription={t("quickActionsEmptyDescription")}
        emptyTitle={t("quickActionsEmptyTitle")}
        key="quick_actions"
        kicker={t("quickActionsKicker")}
        helperText={t("quickActionsHelper")}
        providerLabel={t("providerManagedLabel")}
        title={t("quickActionsTitle")}
        actions={quickActions}
      />,
    ],
    [
      "announcements",
      <PortalNewsCard
        key="announcements"
        description={t("newsDescription")}
        emptyDescription={t("newsEmptyDescription")}
        emptyTitle={t("newsEmptyTitle")}
        fallbackItems={fallbackAnnouncements}
        items={announcements.slice(0, 2).map((announcement) => ({
          id: announcement.id,
          title: announcement.localized_title,
          excerpt: announcement.localized_excerpt,
          publishedAt: formatDate(params.locale, announcement.published_at),
        }))}
        kicker={t("newsKicker")}
        providerLabel={t("providerManagedLabel")}
        readMoreLabel={t("readMoreButton")}
        title={t("newsTitle")}
        viewAllHref={localePath(params.locale, "/portal/news")}
        viewAllLabel={t("viewAllLink")}
      />,
    ],
    [
      "knowledgebase",
      <PortalKnowledgebasePreview
        description={t("knowledgebasePreviewDescription")}
        emptyDescription={t("knowledgebasePreviewEmptyDescription")}
        emptyTitle={t("knowledgebasePreviewEmptyTitle")}
        fallbackItems={fallbackKnowledgebaseItems}
        items={knowledgebaseItems}
        key="knowledgebase"
        kicker={t("knowledgebasePreviewKicker")}
        openLabel={t("openGuideButton")}
        providerLabel={t("providerManagedLabel")}
        title={t("knowledgebasePreviewTitle")}
        viewAllHref={localePath(params.locale, "/portal/knowledgebase")}
        viewAllLabel={t("viewAllLink")}
      />,
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
