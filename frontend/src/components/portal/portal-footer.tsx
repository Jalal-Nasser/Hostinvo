import Link from "next/link";

import { PortalSocialIcon } from "@/components/portal/portal-icons";
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
  columns,
  branding,
}: PortalFooterProps) {
  const currentYear = new Date().getFullYear();
  const demoBrandName =
    branding?.portal_name?.trim() ||
    branding?.company_name?.trim() ||
    "Hostinvo";
  const demoColumns =
    columns.length > 0
      ? columns
      : [
          {
            key: "products",
            title: "Products",
            items: [
              { label: "Web Hosting Plesk", href: localePath(locale, "/portal/products") },
              { label: "SSL Certificates", href: localePath(locale, "/portal/products") },
              { label: "Email Spam Filtering", href: localePath(locale, "/portal/products") },
              { label: "Site Builder", href: localePath(locale, "/portal/products") },
              { label: "Weebly Website Builder", href: localePath(locale, "/portal/products") },
              { label: "Zoho Business Mail", href: localePath(locale, "/portal/products") },
              { label: "Zoho WorkSpace", href: localePath(locale, "/portal/products") },
              { label: "Dedicated Cloud Server", href: localePath(locale, "/portal/products") },
              { label: "Cloud Host", href: localePath(locale, "/portal/products") },
              { label: "VPS Host", href: localePath(locale, "/portal/products") },
              { label: "Backend Server", href: localePath(locale, "/portal/products") },
              { label: "Servers License", href: localePath(locale, "/portal/products") },
              { label: "Domain Pricing", href: localePath(locale, "/portal/domains/pricing") },
            ],
          },
          {
            key: "services",
            title: "Services",
            items: [
              { label: "Website Builder", href: localePath(locale, "/portal/website-security") },
              { label: "Website Security", href: localePath(locale, "/portal/website-security") },
            ],
          },
          {
            key: "support",
            title: "Support",
            items: [
              { label: "About us", href: localePath(locale, "/portal/account") },
              { label: "Contact Us", href: localePath(locale, "/portal/tickets/new") },
              { label: "News", href: localePath(locale, "/portal/news") },
              { label: "Knowledgebase", href: localePath(locale, "/portal/knowledgebase") },
              { label: "Privacy Policy", href: localePath(locale, "/portal/account") },
              { label: "Terms & Conditions", href: localePath(locale, "/portal/account") },
              { label: "Blog", href: localePath(locale, "/portal/news") },
            ],
          },
        ];
  const copyrightText =
    locale === "ar"
      ? `حقوق النشر © ${currentYear} ${demoBrandName}. جميع الحقوق محفوظة.`
      : `Copyright © ${currentYear} ${demoBrandName}. All Rights Reserved.`;

  return (
    <footer className="-ms-4 -me-4 mt-20 border-t border-[rgba(255,255,255,0.08)] pt-14 md:-ms-6 md:-me-6 lg:-ms-0 lg:-me-0">
      <div className="mx-auto grid max-w-[980px] gap-10 ps-8 pe-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_0.9fr_0.9fr]">
        <div className="min-w-0">
          <BrandLogo
            href={localePath(locale, "/portal")}
            className="w-[148px]"
            src={branding?.logo_url}
            alt={demoBrandName}
          />
          <div className="mt-5 flex items-center gap-5 text-[#dce7ff]">
            <PortalSocialIcon icon="facebook" />
            <PortalSocialIcon icon="twitter" />
            <PortalSocialIcon icon="linkedin" />
          </div>
        </div>

        {demoColumns.map((column) => (
          <div key={column.key} className="min-w-0">
            <h3 className="text-[17px] font-medium text-white break-words">
              {column.title}
            </h3>
            <div className="mt-6 grid gap-2">
              {column.items.map((item) => (
                <Link
                  key={`${column.key}-${item.label}`}
                  className="text-[14px] leading-8 text-[#dde7fa] transition hover:text-white break-words"
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

      <div className="mx-auto mt-16 flex max-w-[980px] flex-col gap-3 border-t border-[rgba(255,255,255,0.08)] ps-8 pe-8 pt-6 text-[12px] text-[#dde5f7] md:flex-row md:items-center md:justify-between">
        <p>{copyrightText}</p>
      </div>
    </footer>
  );
}
