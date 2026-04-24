import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ProductAddonForm } from "@/components/catalog/product-addon-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProductsFromCookies } from "@/lib/catalog";
import { fetchProductAddonFromCookies } from "@/lib/product-addons";

export const dynamic = "force-dynamic";

export default async function EditProductAddonPage({
  params,
}: Readonly<{ params: { locale: string; addonId: string } }>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Catalog");
  const cookieHeader = cookies().toString();
  const [products, addon] = await Promise.all([
    fetchProductsFromCookies(cookieHeader, { per_page: "100", type: "hosting" }),
    fetchProductAddonFromCookies(cookieHeader, params.addonId),
  ]);

  if (!addon) {
    notFound();
  }

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
      currentPath={`/dashboard/product-addons/${addon.id}/edit`}
      description={t("editAddonDescription", { name: addon.name })}
      locale={params.locale as AppLocale}
      title={t("editAddonTitle")}
    >
      <ProductAddonForm initialAddon={addon} mode="edit" products={products?.data ?? []} />
    </DashboardShell>
  );
}
