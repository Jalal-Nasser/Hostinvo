import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { DomainHero } from "@/components/portal/domain-hero";
import { PortalNewsCard } from "@/components/portal/portal-news-card";
import { QuickActions } from "@/components/portal/quick-actions";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchAnnouncementsFromCookies,
  fetchPortalConfigFromCookies,
  type PortalSurfaceEntry,
} from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

type HomeSectionKey =
  | "domain_hero"
  | "quick_actions"
  | "announcements";

function defaultSectionEntries(): PortalSurfaceEntry[] {
  return [
    { key: "domain_hero", visible: true, order: 10, label_en: null, label_ar: null },
    { key: "quick_actions", visible: true, order: 20, label_en: null, label_ar: null },
    { key: "announcements", visible: true, order: 30, label_en: null, label_ar: null },
  ];
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
  const sectionEntries = (surface?.home_sections ?? defaultSectionEntries())
    .filter((entry) => entry.visible)
    .sort((left, right) => left.order - right.order);

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

  const quickActions = [
    {
      key: "buy-domain",
      label: "Buy A Domain",
      href: localePath(params.locale, "/portal/domains/register"),
      icon: "buy-domain" as const,
    },
    {
      key: "order-hosting",
      label: "Order Hosting",
      href: localePath(params.locale, "/portal/products"),
      icon: "order-hosting" as const,
    },
    {
      key: "make-payment",
      label: "Make Payment",
      href: localePath(params.locale, "/portal/invoices"),
      icon: "make-payment" as const,
    },
    {
      key: "get-support",
      label: "Get Support",
      href: localePath(params.locale, "/portal/tickets/new"),
      icon: "get-support" as const,
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
        key="quick_actions"
        kicker={t("quickActionsKicker")}
        title={t("quickActionsTitle")}
        actions={quickActions}
      />,
    ],
    [
      "announcements",
      <PortalNewsCard
        key="announcements"
        items={announcements.slice(0, 1).map((announcement) => ({
          id: announcement.id,
          title: announcement.localized_title,
          excerpt: announcement.localized_excerpt,
          publishedAt: formatDate(params.locale, announcement.published_at),
        }))}
        title={t("newsTitle")}
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
