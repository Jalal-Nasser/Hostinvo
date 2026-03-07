import Link from "next/link";
import { getTranslations } from "next-intl/server";

type AuthShellProps = {
  children: React.ReactNode;
  locale: string;
  title: string;
  description: string;
};

export async function AuthShell({
  children,
  locale,
  title,
  description,
}: AuthShellProps) {
  const t = await getTranslations("Auth");

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-12">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-card flex flex-col justify-between gap-6 p-6 md:p-8">
          <div>
            <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.32em] text-accent">
              Hostinvo
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-foreground">
              {title}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted">
              {description}
            </p>
          </div>

          <Link
            href={`/${locale}`}
            className="inline-flex w-fit items-center rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accentSoft"
          >
            {t("backToHome")}
          </Link>
        </section>

        <section className="glass-card p-6 md:p-8">{children}</section>
      </div>
    </main>
  );
}
