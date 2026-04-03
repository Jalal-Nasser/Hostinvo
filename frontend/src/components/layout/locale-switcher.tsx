"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { routing, type AppLocale } from "@/i18n/routing";

type LocaleSwitcherProps = {
  currentLocale: AppLocale;
  path?: string;
};

export function LocaleSwitcher({
  currentLocale,
  path = "/",
}: LocaleSwitcherProps) {
  const t = useTranslations("LocaleSwitcher");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return (
    <nav
      aria-label={t("label")}
      className="inline-flex items-center gap-1 rounded-xl border border-[#e5e7eb] bg-white p-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]"
    >
      {routing.locales.map((locale) => {
        const isActive = locale === currentLocale;

        return (
          <Link
            key={locale}
            href={`/${locale}${normalizedPath === "/" ? "" : normalizedPath}`}
            className={[
              "rounded-lg px-3 py-2 transition-all duration-200",
              isActive
                ? "bg-[linear-gradient(135deg,#048DFE_0%,#036DEB_52%,#0054C5_100%)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(4,109,235,0.18)]"
                : "text-[#4a5e7a] hover:bg-[#f1f5f9] hover:text-[#0a1628]",
            ].join(" ")}
          >
            {locale}
          </Link>
        );
      })}
    </nav>
  );
}
