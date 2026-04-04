import type { AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  localizedValue,
  type PortalFooterLinkRecord,
  type PortalSurfaceEntry,
  type PortalSurfaceSettings,
} from "@/lib/tenant-admin";

export type PortalSectionKey =
  | "products"
  | "domains"
  | "website-security"
  | "support";

export type PortalSection = {
  key: PortalSectionKey;
  configKey: string;
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

type PortalFooterColumn = {
  key: string;
  title: string;
  items: ReadonlyArray<{
    label: string;
    href: string;
    openInNewTab?: boolean;
  }>;
};

const sectionConfigKeyMap: Record<PortalSectionKey, string> = {
  products: "products",
  domains: "domains",
  "website-security": "website_security",
  support: "support",
};

function sectionConfigEntry(
  surface: PortalSurfaceSettings | null | undefined,
  section: PortalSection,
): PortalSurfaceEntry | undefined {
  return surface?.navigation.find((entry) => entry.key === section.configKey);
}

function withSurfaceLabel(
  locale: string,
  fallback: string,
  entry?: PortalSurfaceEntry,
): string {
  if (!entry) {
    return fallback;
  }

  const localized = localizedValue(locale, entry.label_en, entry.label_ar);

  return localized || fallback;
}

function sortBySurfaceOrder<T extends { configKey: string }>(
  records: T[],
  surfaceEntries: PortalSurfaceEntry[] | undefined,
) {
  const entryMap = new Map((surfaceEntries ?? []).map((entry) => [entry.key, entry]));

  return [...records].sort((left, right) => {
    const leftOrder = entryMap.get(left.configKey)?.order ?? 9999;
    const rightOrder = entryMap.get(right.configKey)?.order ?? 9999;

    return leftOrder - rightOrder;
  });
}

export function resolvePortalSectionKey(currentPath: string): PortalSectionKey {
  if (
    currentPath === "/portal" ||
    currentPath.startsWith("/portal/products") ||
    currentPath.startsWith("/portal/services") ||
    currentPath.startsWith("/portal/invoices") ||
    currentPath.startsWith("/portal/cart") ||
    currentPath.startsWith("/portal/account")
  ) {
    return "products";
  }

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
  surface?: PortalSurfaceSettings | null,
): PortalSection[] {
  const productsHref = localePath(locale, "/portal/products");
  const servicesHref = localePath(locale, "/portal/services");
  const invoicesHref = localePath(locale, "/portal/invoices");
  const accountHref = localePath(locale, "/portal/account");
  const domainsHref = localePath(locale, "/portal/domains");
  const registerDomainHref = localePath(locale, "/portal/domains/register");
  const transferDomainHref = localePath(locale, "/portal/domains/transfer");
  const pricingDomainHref = localePath(locale, "/portal/domains/pricing");
  const websiteSecurityHref = localePath(locale, "/portal/website-security");
  const ticketsHref = localePath(locale, "/portal/tickets");
  const newTicketHref = localePath(locale, "/portal/tickets/new");
  const networkStatusHref = localePath(locale, "/portal/network-status");
  const knowledgebaseHref = localePath(locale, "/portal/knowledgebase");
  const newsHref = localePath(locale, "/portal/news");

  const defaults: PortalSection[] = [
    {
      key: "products",
      configKey: sectionConfigKeyMap.products,
      label: t("railProducts"),
      title: t("productsSectionTitle"),
      description: t("productsSectionDescription"),
      href: productsHref,
      icon: "products",
      items: [
        {
          label: t("overviewLink"),
          href: productsHref,
          matchPaths: ["/portal/products", "/portal"],
        },
        {
          label: t("servicesLink"),
          href: servicesHref,
          matchPaths: ["/portal/services"],
        },
        {
          label: t("invoicesLink"),
          href: invoicesHref,
          matchPaths: ["/portal/invoices"],
        },
        {
          label: t("topbarMyAccount"),
          href: accountHref,
          matchPaths: ["/portal/account"],
        },
      ],
      emptyState: {
        title: t("productsEmptyTitle"),
        description: t("productsEmptyDescription"),
        actionLabel: t("productsEmptyAction"),
        actionHref: newTicketHref,
      },
    },
    {
      key: "domains",
      configKey: sectionConfigKeyMap.domains,
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
      configKey: sectionConfigKeyMap["website-security"],
      label: t("railWebsiteSecurity"),
      title: t("websiteSecuritySectionTitle"),
      description: t("websiteSecuritySectionDescription"),
      href: websiteSecurityHref,
      icon: "website-security",
      items: [
        { label: t("submenuSecurityGuides"), href: websiteSecurityHref },
        { label: t("submenuLatestAdvisories"), href: newsHref },
        { label: t("submenuKnowledgebase"), href: knowledgebaseHref },
        { label: t("submenuNetworkStatus"), href: networkStatusHref },
      ],
    },
    {
      key: "support",
      configKey: sectionConfigKeyMap.support,
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

  return sortBySurfaceOrder(defaults, surface?.navigation)
    .filter((section) => sectionConfigEntry(surface, section)?.visible ?? true)
    .map((section) => {
      const entry = sectionConfigEntry(surface, section);

      return {
        ...section,
        label: withSurfaceLabel(locale, section.label, entry),
      };
    });
}

function footerGroupTitle(
  groupKey: string,
  locale: AppLocale,
  t: (key: string) => string,
): string {
  const map: Record<string, string> = locale === "ar"
    ? {
        company: "الشركة",
        products: t("productsSectionTitle"),
        services: t("servicesLink"),
        support: t("footerSupportTitle"),
        resources: "الموارد",
      }
    : {
        company: "Company",
        products: t("productsSectionTitle"),
        services: t("servicesLink"),
        support: t("footerSupportTitle"),
        resources: "Resources",
      };

  return map[groupKey] ?? groupKey.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildPortalFooterColumns(
  locale: AppLocale,
  t: (key: string) => string,
  footerLinks: PortalFooterLinkRecord[] = [],
): PortalFooterColumn[] {
  if (footerLinks.length === 0) {
    return [];
  }

  const groups = new Map<string, PortalFooterColumn>();

  footerLinks
    .slice()
    .sort((left, right) => {
      if (left.group_key === right.group_key) {
        return left.sort_order - right.sort_order;
      }

      return left.group_key.localeCompare(right.group_key);
    })
    .forEach((link) => {
      if (!groups.has(link.group_key)) {
        groups.set(link.group_key, {
          key: link.group_key,
          title: footerGroupTitle(link.group_key, locale, t),
          items: [],
        });
      }

      const group = groups.get(link.group_key);

      if (!group) {
        return;
      }

      (group.items as Array<{ label: string; href: string; openInNewTab?: boolean }>).push({
        label: localizedValue(locale, link.label_en, link.label_ar),
        href: link.href,
        openInNewTab: link.open_in_new_tab,
      });
    });

  return Array.from(groups.values());
}
