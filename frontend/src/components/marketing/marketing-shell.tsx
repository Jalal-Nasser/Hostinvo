import Image from "next/image";
import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";

type MarketingShellProps = {
  locale: AppLocale;
  currentPath: string;
  title?: string;
  description?: string;
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
  const isHome = currentPath === "/";

  const headerNav = [
    { href: localePath(locale, "/features"), label: content.nav.features },
    { href: localePath(locale, "/features"), label: content.nav.automation },
    { href: localePath(locale, "/pricing"), label: content.nav.pricing },
    { href: localePath(locale, "/features"), label: content.nav.integrations },
  ];

  const footerProduct = [
    { href: localePath(locale, "/features"), label: content.nav.features },
    { href: localePath(locale, "/features"), label: content.footer.automation },
    { href: localePath(locale, "/pricing"), label: content.nav.pricing },
    { href: localePath(locale, "/features"), label: content.footer.integrations },
    { href: localePath(locale, "/features"), label: content.footer.security },
  ];
  const footerResources = [
    { href: localePath(locale, "/documentation"), label: content.nav.documentation },
    { href: localePath(locale, "/api-reference"), label: content.footer.apiReference },
    { href: localePath(locale, "/guides"), label: content.footer.guides },
    { href: localePath(locale, "/changelog"), label: content.footer.changelog },
  ];
  const footerCompany = [
    { href: localePath(locale, "/about"), label: content.footer.about },
    { href: localePath(locale, "/contact"), label: content.nav.contact },
    { href: localePath(locale, "/careers"), label: content.footer.careers },
    { href: localePath(locale, "/blog"), label: content.footer.blog },
  ];
  const footerLegal = [
    { href: localePath(locale, "/legal/privacy"), label: content.footer.privacy },
    { href: localePath(locale, "/legal/terms"), label: content.footer.terms },
    { href: localePath(locale, "/legal/cookies"), label: content.footer.cookies },
  ];

  return (
    <div className="marketing-surface min-h-screen flex flex-col">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 border-b border-[rgba(148,163,184,0.1)] bg-[rgba(8,12,24,0.72)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3.5 lg:px-8">
          <BrandLogo
            href={localePath(locale, "/")}
            alt="Hostinvo"
            priority
            className="block w-[156px] shrink-0 sm:w-[172px] lg:w-[184px]"
            imageClassName="h-auto w-full object-contain"
          />
          <nav
            className="hidden items-center gap-0.5 lg:flex"
            aria-label="Main navigation"
          >
            {headerNav.map((item) => {
              const active = item.href === localePath(locale, currentPath);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "marketing-nav-link",
                    active ? "marketing-nav-link-active" : "",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href={localePath(locale, "/auth/login")}
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#93A5C1] transition-colors hover:text-white lg:block"
            >
              {content.nav.login}
            </Link>
            <Link
              href={localePath(locale, "/onboarding")}
              className="btn-primary text-sm px-5 py-2.5"
            >
              {content.nav.startOnboarding}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Inner page title banner (non-home routes) ── */}
      {!isHome && title ? (
        <div className="relative overflow-hidden border-b border-[rgba(148,163,184,0.08)] bg-[#080C1A]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 0%, #048DFE 0%, transparent 45%), radial-gradient(circle at 80% 100%, #036deb 0%, transparent 50%)",
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8">
            <p className="section-label mb-4">{content.badge}</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#F1F5FB] md:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#93A5C1]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-[rgba(148,163,184,0.08)] bg-[#060A14]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[2.2fr_1fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <div className="mb-5 flex items-center gap-3">
                <Image
                  src="/icon.png"
                  alt="Hostinvo"
                  width={44}
                  height={44}
                  className="rounded-xl"
                />
                <span className="text-xl font-bold tracking-tight text-white">
                  Hostinvo
                </span>
              </div>
              <p className="max-w-xs text-[15px] leading-7 text-[#8398B8]">
                {content.heroDescription}
              </p>
              <Link
                href={localePath(locale, "/onboarding")}
                className="btn-primary mt-6 inline-flex px-5 py-2.5 text-sm"
              >
                {content.nav.startOnboarding}
              </Link>
            </div>

            {[
              { title: content.footer.productGroup, items: footerProduct },
              { title: content.footer.resourcesGroup, items: footerResources },
              { title: content.footer.companyGroup, items: footerCompany },
              { title: content.footer.legalGroup, items: footerLegal },
            ].map((group) => (
              <div key={group.title}>
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7DB8FF]">
                  {group.title}
                </p>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-[14.5px] text-[#8398B8] transition-colors hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-[rgba(148,163,184,0.08)] pt-8 lg:flex-row">
            <p className="text-sm text-[#5B6C89]">{content.footer.copyright}</p>
            <p className="text-sm text-[#5B6C89]">{content.footer.techStack}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
