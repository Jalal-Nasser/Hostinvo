import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalContentIndexPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const copy = tenantAdminCopy(params.locale);
  const cards = [
    {
      key: "announcements",
      title: copy.content.announcementsTitle,
      description: copy.content.announcementsDescription,
      href: localePath(params.locale, "/dashboard/content/announcements"),
    },
    {
      key: "knowledgebase",
      title: copy.content.knowledgebaseTitle,
      description: copy.content.knowledgebaseDescription,
      href: localePath(params.locale, "/dashboard/content/knowledgebase"),
    },
    {
      key: "incidents",
      title: copy.content.incidentsTitle,
      description: copy.content.incidentsDescription,
      href: localePath(params.locale, "/dashboard/content/incidents"),
    },
    {
      key: "blocks",
      title: copy.content.blocksTitle,
      description: copy.content.blocksDescription,
      href: localePath(params.locale, "/dashboard/content/website-security"),
    },
    {
      key: "footer",
      title: copy.content.footerLinksTitle,
      description: copy.content.footerLinksDescription,
      href: localePath(params.locale, "/dashboard/content/footer-links"),
    },
  ];

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/settings")}
          className="btn-secondary whitespace-nowrap"
        >
          {copy.common.backToSettings}
        </Link>
      }
      currentPath="/dashboard/content"
      description={copy.content.hubDescription}
      locale={params.locale as AppLocale}
      title={copy.content.hubTitle}
    >
      <section className="grid gap-5 xl:grid-cols-2">
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
    </DashboardShell>
  );
}
