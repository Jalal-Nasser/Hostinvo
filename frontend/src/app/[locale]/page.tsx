import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

const services = [
  "app",
  "nginx",
  "postgres",
  "redis",
  "queue-worker",
  "scheduler",
  "mailpit",
];

export default async function LocaleHomePage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const locale = params.locale as AppLocale;
  const t = await getTranslations("Home");

  const badges = [
    t("badge1"),
    t("badge2"),
    t("badge3"),
    t("badge4"),
    t("badge5"),
    t("badge6"),
  ];

  const deliverables = [
    t("deliverable1"),
    t("deliverable2"),
    t("deliverable3"),
    t("deliverable4"),
    t("deliverable5"),
  ];

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.34em] text-accent">
              {t("phase")}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-foreground md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted md:text-lg">
              {t("description")}
            </p>
          </div>

          <LocaleSwitcher currentLocale={locale} />
        </header>

        <section className="glass-card p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-line bg-white/75 px-4 py-2 text-sm font-medium text-foreground"
              >
                {badge}
              </span>
            ))}

            <Link
              href={localePath(locale, "/auth/login")}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            >
              {t("loginCta")}
            </Link>

            <Link
              href={localePath(locale, "/dashboard")}
              className="rounded-full border border-line bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            >
              {t("dashboardCta")}
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="glass-card overflow-hidden p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-line bg-white/65 p-5">
                <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.28em] text-accent">
                  API
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                  {t("backendTitle")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {t("backendDescription")}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-line bg-accent px-5 py-6 text-white">
                <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.28em] text-white/70">
                  UI
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                  {t("frontendTitle")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/82">
                  {t("frontendDescription")}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-dashed border-line bg-[#fffdf8] p-5">
              <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.28em] text-accent">
                {t("deliverablesTitle")}
              </p>
              <ul className="mt-4 grid gap-3 text-sm leading-7 text-foreground">
                {deliverables.map((deliverable) => (
                  <li
                    key={deliverable}
                    className="flex items-start gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3"
                  >
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-accent" />
                    <span>{deliverable}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <aside className="glass-card p-6 md:p-8">
            <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.28em] text-accent">
              {t("servicesTitle")}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              {t("servicesDescription")}
            </p>

            <div className="mt-6 grid gap-3">
              {services.map((service) => (
                <div
                  key={service}
                  className="flex items-center justify-between rounded-2xl border border-line bg-white/78 px-4 py-3"
                >
                  <span className="font-medium text-foreground">{service}</span>
                  <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    ready
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
