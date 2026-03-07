import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { routing, type AppLocale } from "@/i18n/routing";

type LocaleSwitcherProps = {
  currentLocale: AppLocale;
};

export async function LocaleSwitcher({
  currentLocale,
}: LocaleSwitcherProps) {
  const t = await getTranslations("LocaleSwitcher");

  return (
    <nav
      aria-label={t("label")}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 p-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted"
    >
      {routing.locales.map((locale) => {
        const isActive = locale === currentLocale;

        return (
          <Link
            key={locale}
            href={`/${locale}`}
            className={[
              "rounded-full px-3 py-2 transition",
              isActive
                ? "bg-accent text-white shadow-[0_12px_28px_rgba(15,94,120,0.24)]"
                : "hover:bg-accentSoft hover:text-foreground",
            ].join(" ")}
          >
            {locale}
          </Link>
        );
      })}
    </nav>
  );
}
