import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProductAddonsFromCookies } from "@/lib/product-addons";

export const dynamic = "force-dynamic";

export default async function ProductAddonsPage({
  params,
}: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Catalog");
  const addons = await fetchProductAddonsFromCookies(cookies().toString(), { per_page: "100" });

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/product-addons/new")}
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {t("newAddonButton")}
        </Link>
      }
      currentPath="/dashboard/product-addons"
      description={t("addonsListDescription")}
      locale={params.locale as AppLocale}
      title={t("addonsListTitle")}
    >
      <section className="grid gap-4">
        {(addons?.data ?? []).length === 0 ? (
          <article className="glass-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-foreground">{t("addonsEmptyTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{t("addonsEmptyDescription")}</p>
          </article>
        ) : (
          addons?.data.map((addon) => (
            <article key={addon.id} className="glass-card p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{addon.name}</h2>
                  <p className="mt-2 text-sm text-muted">{addon.description ?? addon.slug}</p>
                  <p className="mt-2 text-sm text-muted">{t("addonProductsCountLabel")}: {addon.products_count ?? 0}</p>
                </div>
                <Link
                  href={localePath(params.locale, `/dashboard/product-addons/${addon.id}/edit`)}
                  className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                >
                  {t("editAddonButton")}
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </DashboardShell>
  );
}
