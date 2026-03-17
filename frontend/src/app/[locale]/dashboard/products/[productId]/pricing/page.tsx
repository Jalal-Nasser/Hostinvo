import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ProductPricingForm } from "@/components/catalog/product-pricing-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProductFromCookies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductPricingPage({
  params,
}: Readonly<{
  params: { locale: string; productId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Catalog");
  const product = await fetchProductFromCookies(cookies().toString(), params.productId);

  if (!product) {
    notFound();
  }

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, `/dashboard/products/${product.id}/edit`)}
          >
            {t("editProductButton")}
          </Link>
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, "/dashboard/products")}
          >
            {t("backToProducts")}
          </Link>
        </div>
      }
      currentPath={`/dashboard/products/${product.id}/pricing`}
      description={t("pricingDescription", { name: product.name })}
      locale={params.locale as AppLocale}
      title={t("pricingTitle")}
    >
      <ProductPricingForm product={product} />
    </DashboardShell>
  );
}
