import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { routing, type AppLocale } from "@/i18n/routing";

type LocaleSwitcherProps = {
  currentLocale: AppLocale;
  path?: string;
};

export async function LocaleSwitcher({
  currentLocale,
  path = "/",
}: LocaleSwitcherProps) {
  const t = await getTranslations("LocaleSwitcher");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return (
    <nav
      aria-label={t("label")}
      className="inline-flex items-center gap-1 rounded-full border border-[rgba(4,141,254,0.2)] bg-white/80 p-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted backdrop-blur-sm"
    >
      {routing.locales.map((locale) => {
        const isActive = locale === currentLocale;

        return (
          <Link
            key={locale}
            href={`/${locale}${normalizedPath === "/" ? "" : normalizedPath}`}
            className={[
              "rounded-full px-3 py-1.5 transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-[#048dfe] to-[#036deb] text-white shadow-[0_2px_12px_rgba(4,141,254,0.4)]"
                : "text-[#4a5e7a] hover:bg-[#e0f0ff] hover:text-[#048dfe]",
            ].join(" ")}
          >
            {locale}
          </Link>
        );
      })}
    </nav>
  );
}
