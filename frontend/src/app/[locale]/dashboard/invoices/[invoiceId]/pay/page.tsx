import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { InvoicePaymentFlow } from "@/components/billing/invoice-payment-flow";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import {
  fetchInvoiceFromCookies,
  fetchInvoiceGatewayOptionsFromCookies,
} from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function InvoicePaymentPage({
  params,
}: Readonly<{
  params: { locale: string; invoiceId: string };
}>) {
  setRequestLocale(params.locale);

  const cookieHeader = cookies().toString();
  const [t, invoice, gateways] = await Promise.all([
    getTranslations("Billing"),
    fetchInvoiceFromCookies(cookieHeader, params.invoiceId),
    fetchInvoiceGatewayOptionsFromCookies(cookieHeader, params.invoiceId),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <DashboardShell
      currentPath={`/dashboard/invoices/${invoice.id}/pay`}
      description={t("payInvoicePageDescription")}
      locale={params.locale as AppLocale}
      title={t("payInvoicePageTitle")}
    >
      <InvoicePaymentFlow invoice={invoice} gateways={gateways ?? []} />
    </DashboardShell>
  );
}
