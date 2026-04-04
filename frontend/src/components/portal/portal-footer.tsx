import Link from "next/link";

import { PortalSocialIcon } from "@/components/portal/portal-icons";
import { PortalLocaleSelect } from "@/components/portal/portal-locale-select";
import { portalTheme } from "@/components/portal/portal-theme";
import { BrandLogo } from "@/components/layout/brand-logo";
import { localePath } from "@/lib/auth";

type PortalFooterColumn = {
  key: string;
  title: string;
  items: ReadonlyArray<{
    label: string;
    href: string;
  }>;
};

type PortalFooterProps = {
  locale: string;
  currentPath: string;
  columns: readonly PortalFooterColumn[];
  t: (key: string) => string;
};

export function PortalFooter({
  locale,
  currentPath,
  columns,
  t,
}: PortalFooterProps) {
  return (
    <footer className="mt-12 border-t border-[rgba(104,123,158,0.12)] pt-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
        <div>
          <BrandLogo href={localePath(locale, "/portal")} className="w-[138px]" />
          <p className="mt-5 text-[13px] leading-7 text-[#aebad4]">{t("footerContactLabel")}</p>

          <div className="mt-4 flex items-center gap-3">
            {(["facebook", "twitter", "linkedin"] as const).map((icon) => (
              <span
                key={icon}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(104,123,158,0.14)] bg-[rgba(255,255,255,0.04)]"
              >
                <PortalSocialIcon icon={icon} />
              </span>
            ))}
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.key}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              {column.title}
            </h3>
            <div className="mt-4 grid gap-1">
              {column.items.map((item) => (
                <Link key={`${column.key}-${item.label}`} className={portalTheme.footerLinkClass} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-[rgba(104,123,158,0.12)] pt-5 text-[12px] text-[#94a8cd] md:flex-row md:items-center md:justify-between">
        <p>{t("footerCopyright")}</p>
        <PortalLocaleSelect
          currentLocale={locale}
          currentPath={currentPath}
          label={t("footerLanguage")}
        />
      </div>
    </footer>
  );
}
