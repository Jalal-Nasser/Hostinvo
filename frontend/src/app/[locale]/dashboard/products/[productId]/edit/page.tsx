import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/catalog/product-form";
import { ProductManagementTabs } from "@/components/catalog/product-management-tabs";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProductFromCookies, fetchProductGroupsFromCookies } from "@/lib/catalog";
import { fetchServersFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string; productId: string };
  searchParams?: { tab?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Catalog");
  const cookieHeader = cookies().toString();
  const [product, groups, servers] = await Promise.all([
    fetchProductFromCookies(cookieHeader, params.productId),
    fetchProductGroupsFromCookies(cookieHeader, { per_page: "100" }),
    fetchServersFromCookies(cookieHeader, { per_page: "100" }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            href={localePath(params.locale, `/dashboard/products/${product.id}/pricing`)}
          >
            {t("managePricingButton")}
          </Link>
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, "/dashboard/products")}
          >
            {t("backToProducts")}
          </Link>
        </div>
      }
      currentPath={`/dashboard/products/${product.id}/edit`}
      description={t("editProductDescription", { name: product.name })}
      locale={params.locale as AppLocale}
      title={t("editProductTitle")}
    >
      <ProductManagementTabs
        active={
          searchParams?.tab === "module"
            ? "module"
            : searchParams?.tab === "configurable-options"
              ? "configurable-options"
              : searchParams?.tab === "other"
                ? "other"
                : "details"
        }
        locale={params.locale}
        productId={product.id}
      />
      <ProductForm
        activeSection={
          searchParams?.tab === "module"
            ? "module"
            : searchParams?.tab === "configurable-options"
              ? "configurable-options"
              : searchParams?.tab === "other"
                ? "other"
                : "details"
        }
        groups={groups?.data ?? []}
        initialProduct={product}
        mode="edit"
        servers={servers?.data ?? []}
      />
    </DashboardShell>
  );
}
