"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { localePath } from "@/lib/auth";

type ProductManagementTabsProps = {
  locale: string;
  productId: string;
  active:
    | "details"
    | "pricing"
    | "module"
    | "configurable-options"
    | "other"
    | "addons";
};

export function ProductManagementTabs({
  locale,
  productId,
  active,
}: ProductManagementTabsProps) {
  const t = useTranslations("Catalog");

  const tabs = [
    {
      key: "details",
      label: t("tabDetails"),
      href: localePath(locale, `/dashboard/products/${productId}/edit`),
      enabled: true,
    },
    {
      key: "pricing",
      label: t("tabPricing"),
      href: localePath(locale, `/dashboard/products/${productId}/pricing`),
      enabled: true,
    },
    {
      key: "module",
      label: t("tabModuleSettings"),
      href: localePath(locale, `/dashboard/products/${productId}/edit?tab=module`),
      enabled: true,
    },
    {
      key: "custom-fields",
      label: t("tabCustomFields"),
      href: "#",
      enabled: false,
    },
    {
      key: "configurable-options",
      label: t("tabConfigurableOptions"),
      href: localePath(locale, `/dashboard/products/${productId}/edit?tab=configurable-options`),
      enabled: true,
    },
    {
      key: "upgrades",
      label: t("tabUpgrades"),
      href: "#",
      enabled: false,
    },
    {
      key: "free-domain",
      label: t("tabFreeDomain"),
      href: "#",
      enabled: false,
    },
    {
      key: "cross-sells",
      label: t("tabCrossSells"),
      href: "#",
      enabled: false,
    },
    {
      key: "other",
      label: t("tabOther"),
      href: localePath(locale, `/dashboard/products/${productId}/edit?tab=other`),
      enabled: true,
    },
    {
      key: "links",
      label: t("tabLinks"),
      href: "#",
      enabled: false,
    },
    {
      key: "addons",
      label: t("tabAddons"),
      href: localePath(locale, "/dashboard/product-addons"),
      enabled: true,
    },
  ] as const;

  return (
    <nav className="flex flex-wrap gap-2 border-b border-line pb-3" aria-label={t("productTabsLabel")}>
      {tabs.map((tab) =>
        tab.enabled ? (
          <Link
            key={tab.key}
            href={tab.href}
            className={[
              "rounded-md border px-3 py-2 text-sm font-medium transition",
              active === tab.key
                ? "border-[#111827] bg-white text-[#111827]"
                : "border-line bg-[#faf9f5]/80 text-muted hover:bg-accentSoft hover:text-foreground",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        ) : (
          <span
            key={tab.key}
            className="rounded-md border border-line bg-[#f4f4f5] px-3 py-2 text-sm font-medium text-[#9ca3af]"
            aria-disabled="true"
          >
            {tab.label}
          </span>
        ),
      )}
    </nav>
  );
}
