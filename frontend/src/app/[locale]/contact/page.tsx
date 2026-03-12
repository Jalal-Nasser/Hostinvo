import { setRequestLocale } from "next-intl/server";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { getLaunchContent } from "@/lib/launch-content";

export default async function ContactPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);

  return (
    <MarketingShell
      currentPath="/contact"
      description={content.sections.contactDescription}
      locale={locale}
      title={content.sections.contactTitle}
    >
      <section className="grid gap-4 md:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-foreground">{content.sections.contactTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-muted">{content.contact.note}</p>
          <div className="mt-6 space-y-3 text-sm">
            <p className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-foreground">
              {content.contact.email}
            </p>
            <p className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-muted">
              {content.contact.salesHours}
            </p>
          </div>
        </article>

        <article className="glass-card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-foreground">{content.contact.formTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            {content.contact.formDescription}
          </p>
          <form className="mt-6 grid gap-4">
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              placeholder={content.contact.formNamePlaceholder}
              type="text"
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              placeholder={content.contact.formEmailPlaceholder}
              type="email"
            />
            <textarea
              className="min-h-32 rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              placeholder={content.contact.formRequirementsPlaceholder}
            />
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              type="button"
            >
              {content.contact.formButtonLabel}
            </button>
          </form>
        </article>
      </section>
    </MarketingShell>
  );
}
