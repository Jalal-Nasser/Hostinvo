import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OrderForm } from "@/components/orders/order-form";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchClientsFromCookies } from "@/lib/clients";
import { fetchProductsFromCookies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Orders");
  const cookieHeader = cookies().toString();
  const [clientsResponse, productsResponse] = await Promise.all([
    fetchClientsFromCookies(cookieHeader, { per_page: "100" }),
    fetchProductsFromCookies(cookieHeader, { per_page: "100", status: "active" }),
  ]);

  return (
    <DashboardShell
      actions={
        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, "/dashboard/orders")}
        >
          {t("backToOrdersButton")}
        </Link>
      }
      currentPath="/dashboard/orders/new"
      description={t("createDescription")}
      locale={params.locale as AppLocale}
      title={t("createTitle")}
    >
      <OrderForm clients={clientsResponse?.data ?? []} products={productsResponse?.data ?? []} />
    </DashboardShell>
  );
}
