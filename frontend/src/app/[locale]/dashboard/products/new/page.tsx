import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProductForm } from "@/components/catalog/product-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProductGroupsFromCookies } from "@/lib/catalog";
import { fetchServersFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function NewProductPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Catalog");
  const cookieHeader = cookies().toString();
  const [groups, servers] = await Promise.all([
    fetchProductGroupsFromCookies(cookieHeader, { per_page: "100" }),
    fetchServersFromCookies(cookieHeader, { per_page: "100" }),
  ]);

  return (
    <DashboardShell
      actions={
        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, "/dashboard/products")}
        >
          {t("backToProducts")}
        </Link>
      }
      currentPath="/dashboard/products/new"
      description={t("createProductDescription")}
      locale={params.locale as AppLocale}
      title={t("createProductTitle")}
    >
      <ProductForm groups={groups?.data ?? []} mode="create" servers={servers?.data ?? []} />
    </DashboardShell>
  );
}
