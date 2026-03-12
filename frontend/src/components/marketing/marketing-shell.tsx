import Link from "next/link";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";

type MarketingShellProps = {
  locale: AppLocale;
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export async function MarketingShell({
  locale,
  currentPath,
  title,
  description,
  children,
}: MarketingShellProps) {
  const content = getLaunchContent(locale);

  const navItems = [
    { href: localePath(locale, "/"), label: content.nav.home },
    { href: localePath(locale, "/pricing"), label: content.nav.pricing },
    { href: localePath(locale, "/features"), label: content.nav.features },
    { href: localePath(locale, "/documentation"), label: content.nav.documentation },
    { href: localePath(locale, "/contact"), label: content.nav.contact },
    { href: localePath(locale, "/onboarding"), label: content.nav.onboarding },
  ];

  return (
    <main className="min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="glass-card p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.32em] text-accent">
                {content.badge}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-foreground md:text-5xl">
                {title}
              </h1>
              <p className="mt-4 text-sm leading-7 text-muted md:text-base">{description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={localePath(locale, "/onboarding")}
                  className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  {content.nav.onboarding}
                </Link>
                <Link
                  href={localePath(locale, "/auth/login")}
                  className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                >
                  {content.nav.login}
                </Link>
              </div>
            </div>

            <LocaleSwitcher currentLocale={locale} path={currentPath} />
          </div>
        </header>

        <nav className="flex flex-wrap gap-3" aria-label="Marketing navigation">
          {navItems.map((item) => {
            const active = item.href === localePath(locale, currentPath);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-white/75 text-foreground hover:bg-accentSoft",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </main>
  );
}
