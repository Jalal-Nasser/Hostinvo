import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { getAuthenticatedUserFromCookies, isPlatformOwnerContext, localePath } from "@/lib/auth";
import { fetchProductGroupsFromCookies, fetchProductsFromCookies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: {
    search?: string;
    status?: string;
    product_group_id?: string;
    page?: string;
  };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Catalog");
  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);

  if (user && isPlatformOwnerContext(user)) {
    redirect(localePath(params.locale, "/dashboard/plans"));
  }
  const [groupsResponse, productsResponse] = await Promise.all([
    fetchProductGroupsFromCookies(cookieHeader, { per_page: "100" }),
    fetchProductsFromCookies(cookieHeader, {
      search: searchParams?.search,
      status: searchParams?.status,
      product_group_id: searchParams?.product_group_id,
      page: searchParams?.page,
    }),
  ]);

  const groups = groupsResponse?.data ?? [];
  const products = productsResponse?.data ?? [];

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/products/new")}
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {t("newProductButton")}
        </Link>
      }
      currentPath="/dashboard/products"
      description={t("productsListDescription")}
      locale={params.locale as AppLocale}
      title={t("productsListTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("searchLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("productSearchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="draft">{t("statusDraft")}</option>
              <option value="active">{t("statusActive")}</option>
              <option value="inactive">{t("statusInactive")}</option>
              <option value="archived">{t("statusArchived")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("productGroupLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.product_group_id ?? ""}
              name="product_group_id"
            >
              <option value="">{t("allGroups")}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              type="submit"
            >
              {t("searchButton")}
            </button>

            <Link
              className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
              href={localePath(params.locale, "/dashboard/products")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {products.length === 0 ? (
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("productsEmptyTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            {t("productsEmptyDescription")}
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {products.map((product) => (
            <article key={product.id} className="glass-card p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">{product.name}</h2>
                    <span className="rounded-full border border-line bg-[#faf9f5]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {product.status === "draft"
                        ? t("statusDraft")
                        : product.status === "active"
                          ? t("statusActive")
                          : product.status === "inactive"
                            ? t("statusInactive")
                            : t("statusArchived")}
                    </span>
                    {product.is_featured ? (
                      <span className="rounded-full border border-line bg-accentSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                        {t("featuredBadge")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-muted">{product.summary ?? product.slug}</p>
                  <p className="mt-2 text-sm text-muted">
                    {product.group?.name ?? t("ungroupedOption")} · {t("typeHosting")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/dashboard/products/${product.id}/edit`)}
                  >
                    {t("editProductButton")}
                  </Link>
                  <Link
                    className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/dashboard/products/${product.id}/pricing`)}
                  >
                    {t("managePricingButton")}
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("visibilityLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {product.visibility === "public"
                      ? t("visibilityPublic")
                      : product.visibility === "private"
                        ? t("visibilityPrivate")
                        : t("visibilityHidden")}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("pricingCountLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{product.pricing_count ?? 0}</p>
                </div>

                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">
                    {t("configurableOptionsCountLabel")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {product.configurable_options_count ?? 0}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("startingPriceLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {product.starting_price
                      ? new Intl.NumberFormat(params.locale, {
                          style: "currency",
                          currency: product.starting_price.currency,
                        }).format(Number(product.starting_price.price))
                      : t("notAvailable")}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
