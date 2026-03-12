import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";

export default async function LocaleHomePage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);

  return (
    <MarketingShell
      currentPath="/"
      description={content.heroDescription}
      locale={locale}
      title={content.heroTitle}
    >
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="glass-card p-6 md:p-8">
          <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.28em] text-accent">
            {content.sections.featuresTitle}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">{content.sections.featuresDescription}</p>
          <div className="mt-6 grid gap-3">
            {content.features.slice(0, 4).map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-line bg-white/80 px-4 py-4"
              >
                <h2 className="text-sm font-semibold text-foreground">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href={localePath(locale, "/features")}
              className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            >
              {content.nav.features}
            </Link>
          </div>
        </article>

        <aside className="glass-card p-6 md:p-8">
          <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.28em] text-accent">
            {content.sections.plansTitle}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">{content.sections.plansDescription}</p>
          <div className="mt-6 grid gap-3">
            {content.plans.map((plan) => (
              <article
                key={plan.key}
                className="rounded-2xl border border-line bg-white/80 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-foreground">{plan.name}</h2>
                  <span className="text-sm font-semibold text-accent">{plan.price}</span>
                </div>
                <ul className="mt-3 grid gap-2 text-sm text-muted">
                  {plan.limits.map((limit) => (
                    <li key={limit} className="flex items-start gap-2">
                      <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{limit}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={localePath(locale, "/pricing")}
              className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            >
              {content.secondaryCta}
            </Link>
            <Link
              href={localePath(locale, "/onboarding")}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            >
              {content.primaryCta}
            </Link>
          </div>
        </aside>
      </section>
    </MarketingShell>
  );
}
