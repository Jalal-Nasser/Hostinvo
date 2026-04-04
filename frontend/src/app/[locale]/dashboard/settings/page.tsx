import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  params: {
    locale: string;
  };
};

export default async function SettingsPage({ params }: Readonly<SettingsPageProps>) {
  setRequestLocale(params.locale);
  const copy = tenantAdminCopy(params.locale);

  const cards = [
    {
      key: "branding",
      title: copy.settings.brandingTitle,
      description: copy.settings.brandingDescription,
      href: localePath(params.locale, "/dashboard/settings/branding"),
    },
    {
      key: "surface",
      title: copy.settings.surfaceTitle,
      description: copy.settings.surfaceDescription,
      href: localePath(params.locale, "/dashboard/settings/portal"),
    },
    {
      key: "content",
      title: copy.settings.contentTitle,
      description: copy.settings.contentDescription,
      href: localePath(params.locale, "/dashboard/content"),
    },
  ];

  return (
    <DashboardShell
      currentPath="/dashboard/settings"
      description={copy.settings.description}
      locale={params.locale as AppLocale}
      title={copy.settings.title}
    >
      <section className="grid gap-5 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.key} className="glass-card p-6 md:p-8">
            <p className="dashboard-kicker">{copy.settings.openModule}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
              {card.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              {card.description}
            </p>
            <div className="mt-6">
              <Link className="btn-primary" href={card.href}>
                {copy.settings.openModule}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="glass-card p-6 md:p-8">
        <p className="dashboard-kicker">{copy.settings.title}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={`${card.key}-summary`}
              className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-4 text-sm font-medium text-[#33506f]"
            >
              <p className="font-semibold text-[#0a1628]">{card.title}</p>
              <p className="mt-2 text-[#5f7389]">{card.description}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
