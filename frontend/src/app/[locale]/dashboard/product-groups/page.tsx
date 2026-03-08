import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProductGroupManager } from "@/components/catalog/product-group-manager";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProductGroupsFromCookies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductGroupsPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: {
    search?: string;
    status?: string;
    visibility?: string;
    page?: string;
  };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Catalog");
  const response = await fetchProductGroupsFromCookies(cookies().toString(), {
    search: searchParams?.search,
    status: searchParams?.status,
    visibility: searchParams?.visibility,
    page: searchParams?.page,
  });

  return (
    <DashboardShell
      currentPath="/dashboard/product-groups"
      description={t("productGroupsDescription")}
      locale={params.locale as AppLocale}
      title={t("productGroupsTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("searchLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("groupSearchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="active">{t("statusActive")}</option>
              <option value="inactive">{t("statusInactive")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("visibilityLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.visibility ?? ""}
              name="visibility"
            >
              <option value="">{t("allVisibility")}</option>
              <option value="public">{t("visibilityPublic")}</option>
              <option value="private">{t("visibilityPrivate")}</option>
              <option value="hidden">{t("visibilityHidden")}</option>
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
              className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
              href={localePath(params.locale, "/dashboard/product-groups")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      <ProductGroupManager initialGroups={response?.data ?? []} />
    </DashboardShell>
  );
}
