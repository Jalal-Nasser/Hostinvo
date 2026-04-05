import Link from "next/link";

import { PortalLocaleSelect } from "@/components/portal/portal-locale-select";
import { portalTheme } from "@/components/portal/portal-theme";
import { BrandLogo } from "@/components/layout/brand-logo";
import { localePath } from "@/lib/auth";
import type { TenantBrandingRecord } from "@/lib/tenant-admin";

type PortalFooterColumn = {
  key: string;
  title: string;
  items: ReadonlyArray<{
    label: string;
    href: string;
    openInNewTab?: boolean;
  }>;
};

type PortalFooterProps = {
  locale: string;
  currentPath: string;
  columns: readonly PortalFooterColumn[];
  t: (key: string) => string;
  branding?: TenantBrandingRecord | null;
};

export function PortalFooter({
  locale,
  currentPath,
  columns,
  t,
  branding,
}: PortalFooterProps) {
  const currentYear = new Date().getFullYear();
  const brandName =
    branding?.portal_name?.trim() ||
    branding?.company_name?.trim() ||
    (locale === "ar" ? "بوابة العملاء" : "Client portal");
  const footerSummary =
    branding?.portal_tagline?.trim() ||
    branding?.company_name?.trim() ||
    null;
  const emptyState =
    locale === "ar"
      ? "لم يتم نشر روابط بوابة مخصصة بعد. ستظهر هنا الروابط والمعلومات التي يضيفها مدير المستأجر."
      : "No custom portal links have been published yet. Tenant-managed footer links will appear here once the admin adds them.";
  const copyrightText =
    locale === "ar"
      ? `حقوق النشر © ${currentYear} ${brandName}. جميع الحقوق محفوظة.`
      : `Copyright © ${currentYear} ${brandName}. All rights reserved.`;

  return (
    <footer className="mt-12 border-t border-[rgba(104,123,158,0.12)] pt-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
        <div>
          <BrandLogo
            href={localePath(locale, "/portal")}
            className="w-[138px]"
            src={branding?.logo_url}
            alt={brandName}
            fallbackText={!branding?.logo_url ? brandName : undefined}
          />
          {footerSummary ? (
            <p className="mt-5 text-[13px] leading-7 text-[#aebad4]">{footerSummary}</p>
          ) : null}
        </div>

        {columns.length === 0 ? (
          <div className="lg:col-span-3">
            <div className={portalTheme.noteClass}>{emptyState}</div>
          </div>
        ) : null}

        {columns.map((column) => (
          <div key={column.key}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              {column.title}
            </h3>
            <div className="mt-4 grid gap-1">
              {column.items.map((item) => (
                <Link
                  key={`${column.key}-${item.label}`}
                  className={portalTheme.footerLinkClass}
                  href={item.href}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noreferrer" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-[rgba(104,123,158,0.12)] pt-5 text-[12px] text-[#94a8cd] md:flex-row md:items-center md:justify-between">
        <p>{copyrightText}</p>
        <PortalLocaleSelect
          currentLocale={locale}
          currentPath={currentPath}
          label={t("footerLanguage")}
        />
      </div>
    </footer>
  );
}
