import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchKnowledgeBaseFromCookies,
  fetchPortalConfigFromCookies,
} from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function PortalKnowledgebasePage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { query?: string };
}>) {
  setRequestLocale(params.locale);

  const cookieHeader = cookies().toString();
  const t = await getTranslations("Portal");
  const query = searchParams?.query?.trim().toLowerCase() ?? "";
  const portalConfig = await fetchPortalConfigFromCookies(cookieHeader);
  const knowledgebase =
    portalConfig?.surface.content_sources.knowledgebase === false
      ? null
      : await fetchKnowledgeBaseFromCookies(cookieHeader, "client");

  const categories =
    knowledgebase && Array.isArray(knowledgebase.categories)
      ? knowledgebase.categories
      : [];

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      articles: (category.articles ?? []).filter((article) => {
        if (!query) {
          return true;
        }

        const haystack = `${article.localized_title} ${article.localized_excerpt ?? ""} ${
          article.localized_body
        } ${category.localized_name}`.toLowerCase();

        return haystack.includes(query);
      }),
    }))
    .filter((category) => {
      if (!query) {
        return true;
      }

      const categoryMatch = `${category.localized_name} ${
        category.localized_description ?? ""
      }`.toLowerCase();

      return categoryMatch.includes(query) || (category.articles?.length ?? 0) > 0;
    });

  const hasArticles = filteredCategories.some(
    (category) => (category.articles?.length ?? 0) > 0,
  );

  return (
    <PortalShell
      actions={
        <Link
          className={portalTheme.secondaryButtonClass}
          href={localePath(params.locale, "/portal/tickets")}
        >
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
            <Link
              className={portalTheme.secondaryButtonClass}
              href={localePath(params.locale, "/portal/knowledgebase")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>

        <p className="mt-4 text-sm leading-7 text-[#aebad4]">
          {t("knowledgebasePublishedNote")}
        </p>
      </section>

      {portalConfig?.surface.content_sources.knowledgebase === false || !hasArticles ? (
        <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <h3 className="text-lg font-semibold text-white">{t("knowledgebaseEmptyTitle")}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aebad4]">
            {portalConfig?.surface.content_sources.knowledgebase === false
              ? t("knowledgebasePublishedNote")
              : t("knowledgebaseEmptyDescription")}
          </p>
        </article>
      ) : (
        <section className="grid gap-5">
          {filteredCategories.map((category) => (
            <article
              key={category.id}
              className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}
            >
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.02em] text-white">
                {category.localized_name}
              </h2>
              {category.localized_description ? (
                <p className="mt-3 text-sm leading-7 text-[#aebad4]">
                  {category.localized_description}
                </p>
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(category.articles ?? []).map((article) => (
                  <article
                    key={article.id}
                    className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}
                  >
                    <h3 className="text-lg font-semibold text-white">
                      {article.localized_title}
                    </h3>
                    {article.localized_excerpt ? (
                      <p className="mt-3 text-sm leading-7 text-[#aebad4]">
                        {article.localized_excerpt}
                      </p>
                    ) : null}
                    <div className="mt-4 text-sm leading-7 text-[#d8e3f8]">
                      {article.localized_body}
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </PortalShell>
  );
}
