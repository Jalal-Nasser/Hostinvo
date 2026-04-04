import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalKnowledgebasePage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { query?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Portal");
  const query = searchParams?.query?.trim().toLowerCase() ?? "";

  const topics = [
    {
      key: "register",
      title: t("knowledgebaseTopicRegisterTitle"),
      description: t("knowledgebaseTopicRegisterDescription"),
      href: localePath(params.locale, "/portal/domains/register"),
    },
    {
      key: "transfer",
      title: t("knowledgebaseTopicTransferTitle"),
      description: t("knowledgebaseTopicTransferDescription"),
      href: localePath(params.locale, "/portal/domains/transfer"),
    },
    {
      key: "pricing",
      title: t("knowledgebaseTopicPricingTitle"),
      description: t("knowledgebaseTopicPricingDescription"),
      href: localePath(params.locale, "/portal/domains/pricing"),
    },
    {
      key: "support",
      title: t("knowledgebaseTopicSupportTitle"),
      description: t("knowledgebaseTopicSupportDescription"),
      href: localePath(params.locale, "/portal/tickets/new"),
    },
  ].filter((topic) => {
    if (!query) {
      return true;
    }

    const haystack = `${topic.title} ${topic.description}`.toLowerCase();

    return haystack.includes(query);
  });

  return (
    <PortalShell
      actions={
        <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/tickets")}>
          {t("viewTicketsButton")}
        </Link>
      }
      currentPath="/portal/knowledgebase"
      description={t("knowledgebasePageDescription")}
      locale={params.locale as AppLocale}
      title={t("knowledgebasePageTitle")}
    >
      <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
        <form className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-[#dfe7f7]">
            <span>{t("knowledgebaseSearchLabel")}</span>
            <input
              className={portalTheme.fieldClass}
              defaultValue={searchParams?.query ?? ""}
              name="query"
              placeholder={t("knowledgebaseSearchPlaceholder")}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button className={portalTheme.primaryButtonClass} type="submit">
              {t("heroSearchButton")}
            </button>
            <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/knowledgebase")}>
              {t("clearFilters")}
            </Link>
          </div>
        </form>

        <p className="mt-4 text-sm leading-7 text-[#aebad4]">{t("knowledgebasePublishedNote")}</p>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-[1.4rem] font-semibold tracking-[-0.02em] text-white">
            {t("knowledgebaseFeaturedTitle")}
          </h2>
        </div>

        {topics.length === 0 ? (
          <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
            <h3 className="text-lg font-semibold text-white">{t("knowledgebaseEmptyTitle")}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aebad4]">
              {t("knowledgebaseEmptyDescription")}
            </p>
          </article>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {topics.map((topic) => (
              <article key={topic.key} className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
                <h3 className="text-lg font-semibold text-white">{topic.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#aebad4]">{topic.description}</p>
                <div className="mt-5">
                  <Link className={portalTheme.secondaryButtonClass} href={topic.href}>
                    {t("openGuideButton")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
}
