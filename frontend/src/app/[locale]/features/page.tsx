import { setRequestLocale } from "next-intl/server";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { getLaunchContent } from "@/lib/launch-content";

export default async function FeaturesPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);

  return (
    <MarketingShell
      currentPath="/features"
      description={content.sections.featuresDescription}
      locale={locale}
      title={content.sections.featuresTitle}
    >
      <section className="grid gap-4 md:grid-cols-2">
        {content.features.map((feature) => (
          <article key={feature.title} className="glass-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-foreground">{feature.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{feature.description}</p>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
}
