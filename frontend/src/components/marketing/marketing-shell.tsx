import Image from "next/image";
import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
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

export async function MarketingShell({ locale, currentPath, title, description, children }: MarketingShellProps) {
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
    <div className="min-h-screen flex flex-col bg-[#f7faff]">
      <header className="sticky top-0 z-50 border-b border-[rgba(4,141,254,0.1)] bg-[rgba(247,250,255,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 lg:px-8">
          <BrandLogo href={localePath(locale, "/")} priority className="block w-36 shrink-0" />
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            {headerNav.map((item) => {
              const active = item.href === localePath(locale, currentPath);
              return (
                <Link key={item.label} href={item.href} className={["rounded-lg px-3.5 py-2 text-sm font-medium transition-colors", active ? "bg-[#e0f0ff] text-[#048dfe]" : "text-[#4a5e7a] hover:bg-[#f0f7ff] hover:text-[#048dfe]"].join(" ")}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <LocaleSwitcher currentLocale={locale} path={currentPath} />
            <Link href={localePath(locale, "/auth/login")} className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#4a5e7a] transition hover:text-[#048dfe] lg:block">{content.nav.login}</Link>
            <Link href={localePath(locale, "/onboarding")} className="btn-primary text-sm px-5 py-2.5">{content.nav.startOnboarding}</Link>
          </div>
        </div>
      </header>

      {!isHome && title && (
        <div className="border-b border-[rgba(4,141,254,0.08)] bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <p className="section-label mb-4">{content.badge}</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#0a1628] md:text-5xl">{title}</h1>
            {description && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#4a5e7a]">{description}</p>}
          </div>
        </div>
      )}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-[rgba(4,141,254,0.1)] bg-[#0a1628]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[2.2fr_1fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Image src="/icon.png" alt="Hostinvo" width={44} height={44} className="rounded-xl" />
                <span className="text-xl font-bold text-white tracking-tight">Hostinvo</span>
              </div>
              <p className="max-w-xs text-[15px] leading-7 text-[#8aaac8]">{content.heroDescription}</p>
              <Link href={localePath(locale, "/onboarding")} className="btn-primary mt-6 inline-flex text-sm px-5 py-2.5">{content.nav.startOnboarding}</Link>
            </div>
            {/* Product */}
            <div>
              <p className="mb-5 text-[13px] font-bold uppercase tracking-widest text-[#048dfe]">{content.footer.productGroup}</p>
              <ul className="space-y-3.5">
                {footerProduct.map((item) => (
                  <li key={item.label}><Link href={item.href} className="text-[15px] text-[#8aaac8] transition-colors hover:text-white">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            {/* Resources */}
            <div>
              <p className="mb-5 text-[13px] font-bold uppercase tracking-widest text-[#048dfe]">{content.footer.resourcesGroup}</p>
              <ul className="space-y-3.5">
                {footerResources.map((item) => (
                  <li key={item.label}><Link href={item.href} className="text-[15px] text-[#8aaac8] transition-colors hover:text-white">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div>
              <p className="mb-5 text-[13px] font-bold uppercase tracking-widest text-[#048dfe]">{content.footer.companyGroup}</p>
              <ul className="space-y-3.5">
                {footerCompany.map((item) => (
                  <li key={item.label}><Link href={item.href} className="text-[15px] text-[#8aaac8] transition-colors hover:text-white">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div>
              <p className="mb-5 text-[13px] font-bold uppercase tracking-widest text-[#048dfe]">{content.footer.legalGroup}</p>
              <ul className="space-y-3.5">
                {footerLegal.map((item) => (
                  <li key={item.label}><Link href={item.href} className="text-[15px] text-[#8aaac8] transition-colors hover:text-white">{item.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.07)] pt-8 lg:flex-row">
            <p className="text-sm text-[#4a5e7a]">{content.footer.copyright}</p>
            <p className="text-sm text-[#4a5e7a]">{content.footer.techStack}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
