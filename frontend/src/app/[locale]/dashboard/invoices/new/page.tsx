import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { InvoiceForm } from "@/components/billing/invoice-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { fetchClientsFromCookies } from "@/lib/clients";
import { fetchOrdersFromCookies } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Billing");
  const cookieHeader = cookies().toString();
  const [clientsResponse, ordersResponse] = await Promise.all([
    fetchClientsFromCookies(cookieHeader, { per_page: "100" }),
    fetchOrdersFromCookies(cookieHeader, { per_page: "100" }),
  ]);

  return (
    <DashboardShell
      currentPath="/dashboard/invoices/new"
      description={t("createDescription")}
      locale={params.locale as AppLocale}
      title={t("createTitle")}
    >
      <InvoiceForm
        clients={clientsResponse?.data ?? []}
        mode="create"
        orders={ordersResponse?.data ?? []}
      />
    </DashboardShell>
  );
}
