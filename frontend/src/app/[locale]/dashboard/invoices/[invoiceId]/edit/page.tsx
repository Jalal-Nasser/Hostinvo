import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { InvoiceForm } from "@/components/billing/invoice-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { fetchInvoiceFromCookies } from "@/lib/billing";
import { fetchClientsFromCookies } from "@/lib/clients";
import { fetchOrdersFromCookies } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: Readonly<{
  params: { locale: string; invoiceId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Billing");
  const cookieHeader = cookies().toString();
  const [invoice, clientsResponse, ordersResponse] = await Promise.all([
    fetchInvoiceFromCookies(cookieHeader, params.invoiceId),
    fetchClientsFromCookies(cookieHeader, { per_page: "100" }),
    fetchOrdersFromCookies(cookieHeader, { per_page: "100" }),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <DashboardShell
      currentPath={`/dashboard/invoices/${invoice.id}/edit`}
      description={t("editDescription", { reference: invoice.reference_number })}
      locale={params.locale as AppLocale}
      title={t("editTitle")}
    >
      <InvoiceForm
        clients={clientsResponse?.data ?? []}
        initialInvoice={invoice}
        mode="edit"
        orders={ordersResponse?.data ?? []}
      />
    </DashboardShell>
  );
}
