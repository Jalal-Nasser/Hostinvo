import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";

export default async function PricingPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);

  return (
    <MarketingShell
      currentPath="/pricing"
      description={content.sections.plansDescription}
      locale={locale}
      title={content.sections.plansTitle}
    >
      <section className="grid gap-4 lg:grid-cols-3">
        {content.plans.map((plan) => (
          <article key={plan.key} className="glass-card p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-foreground">{plan.name}</h2>
              <span className="text-sm font-semibold text-accent">{plan.price}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">{plan.description}</p>
            <ul className="mt-5 grid gap-3 text-sm text-muted">
              {plan.limits.map((limit) => (
                <li key={limit} className="flex items-start gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3">
                  <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>{limit}</span>
                </li>
              ))}
            </ul>
            <Link
              href={localePath(locale, "/onboarding")}
              className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              {plan.ctaLabel}
            </Link>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}
