import type { AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export type PortalSectionKey = "products" | "domains" | "website-security" | "support";

export type PortalSection = {
  key: PortalSectionKey;
  label: string;
  title: string;
  description: string;
  href: string;
  icon: PortalSectionKey;
  items: Array<{
    label: string;
    href: string;
    matchPaths?: string[];
  }>;
  emptyState?: {
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
  };
};

export function resolvePortalSectionKey(currentPath: string): PortalSectionKey {
  if (currentPath.startsWith("/portal/domains")) {
    return "domains";
  }

  if (
    currentPath.startsWith("/portal/tickets") ||
    currentPath.startsWith("/portal/network-status") ||
    currentPath.startsWith("/portal/knowledgebase") ||
    currentPath.startsWith("/portal/news")
  ) {
    return "support";
  }

  if (currentPath.startsWith("/portal/website-security")) {
    return "website-security";
  }

  return "products";
}

export function buildPortalSections(
  locale: AppLocale,
  t: (key: string) => string,
): PortalSection[] {
  const homeHref = localePath(locale, "/portal");
  const domainsHref = localePath(locale, "/portal/domains");
  const registerDomainHref = localePath(locale, "/portal/domains/register");
  const transferDomainHref = localePath(locale, "/portal/domains/transfer");
  const pricingDomainHref = localePath(locale, "/portal/domains/pricing");
  const ticketsHref = localePath(locale, "/portal/tickets");
  const newTicketHref = localePath(locale, "/portal/tickets/new");
  const networkStatusHref = localePath(locale, "/portal/network-status");
  const knowledgebaseHref = localePath(locale, "/portal/knowledgebase");
  const newsHref = localePath(locale, "/portal/news");

  return [
    {
      key: "products",
      label: t("railProducts"),
      title: t("productsSectionTitle"),
      description: t("productsSectionDescription"),
      href: homeHref,
      icon: "products",
      items: [],
      emptyState: {
        title: t("productsEmptyTitle"),
        description: t("productsEmptyDescription"),
        actionLabel: t("productsEmptyAction"),
        actionHref: newTicketHref,
      },
    },
    {
      key: "domains",
      label: t("railDomains"),
      title: t("domainsSectionTitle"),
      description: t("domainsSectionDescription"),
      href: domainsHref,
      icon: "domains",
      items: [
        {
          label: t("submenuRegisterNewDomain"),
          href: registerDomainHref,
          matchPaths: ["/portal/domains/register"],
        },
        {
          label: t("submenuTransferDomains"),
          href: transferDomainHref,
          matchPaths: ["/portal/domains/transfer"],
        },
        {
          label: t("submenuDomainPricing"),
          href: pricingDomainHref,
          matchPaths: ["/portal/domains/pricing", "/portal/domains"],
        },
      ],
    },
    {
      key: "website-security",
      label: t("railWebsiteSecurity"),
      title: t("websiteSecuritySectionTitle"),
      description: t("websiteSecuritySectionDescription"),
      href: `${homeHref}#website-security`,
      icon: "website-security",
      items: [
        { label: t("submenuSecurityGuides"), href: knowledgebaseHref },
        { label: t("submenuLatestAdvisories"), href: newsHref },
        { label: t("submenuKnowledgebase"), href: knowledgebaseHref },
        { label: t("submenuNetworkStatus"), href: networkStatusHref },
      ],
    },
    {
      key: "support",
      label: t("railSupport"),
      title: t("supportSectionTitle"),
      description: t("supportSectionDescription"),
      href: ticketsHref,
      icon: "support",
      items: [
        {
          label: t("ticketsLink"),
          href: ticketsHref,
          matchPaths: ["/portal/tickets"],
        },
        {
          label: t("submenuContactUs"),
          href: newTicketHref,
          matchPaths: ["/portal/tickets/new"],
        },
        {
          label: t("submenuNetworkStatus"),
          href: networkStatusHref,
          matchPaths: ["/portal/network-status"],
        },
        {
          label: t("submenuKnowledgebase"),
          href: knowledgebaseHref,
          matchPaths: ["/portal/knowledgebase"],
        },
        {
          label: t("submenuNews"),
          href: newsHref,
          matchPaths: ["/portal/news"],
        },
      ],
    },
  ];
}

export function buildPortalFooterColumns(
  locale: AppLocale,
  t: (key: string) => string,
) {
  const homeHref = localePath(locale, "/portal");
  const ticketsHref = localePath(locale, "/portal/tickets");
  const networkStatusHref = localePath(locale, "/portal/network-status");
  const knowledgebaseHref = localePath(locale, "/portal/knowledgebase");
  const newsHref = localePath(locale, "/portal/news");

  return [
    {
      key: "products",
      title: t("productsSectionTitle"),
      items: [
        { label: t("overviewLink"), href: homeHref },
        { label: t("ticketsLink"), href: ticketsHref },
        { label: t("submenuContactUs"), href: localePath(locale, "/portal/tickets/new") },
      ],
    },
    {
      key: "domains",
      title: t("domainsSectionTitle"),
      items: [
        { label: t("submenuRegisterNewDomain"), href: localePath(locale, "/portal/domains/register") },
        { label: t("submenuTransferDomains"), href: localePath(locale, "/portal/domains/transfer") },
        { label: t("submenuDomainPricing"), href: localePath(locale, "/portal/domains/pricing") },
      ],
    },
    {
      key: "support",
      title: t("footerSupportTitle"),
      items: [
        { label: t("ticketsLink"), href: ticketsHref },
        { label: t("submenuContactUs"), href: localePath(locale, "/portal/tickets/new") },
        { label: t("submenuNetworkStatus"), href: networkStatusHref },
        { label: t("submenuKnowledgebase"), href: knowledgebaseHref },
        { label: t("submenuNews"), href: newsHref },
      ],
    },
  ] as const;
}
