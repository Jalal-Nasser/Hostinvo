import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProductAddonForm } from "@/components/catalog/product-addon-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProductsFromCookies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function NewProductAddonPage({
  params,
}: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Catalog");
  const products = await fetchProductsFromCookies(cookies().toString(), { per_page: "100", type: "hosting" });

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/product-addons")}
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
        >
          {t("backToAddons")}
        </Link>
      }
      currentPath="/dashboard/product-addons/new"
      description={t("createAddonDescription")}
      locale={params.locale as AppLocale}
      title={t("createAddonTitle")}
    >
      <ProductAddonForm mode="create" products={products?.data ?? []} />
    </DashboardShell>
  );
}
