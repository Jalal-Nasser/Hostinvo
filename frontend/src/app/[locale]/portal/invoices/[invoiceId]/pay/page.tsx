import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { InvoicePaymentFlow } from "@/components/billing/invoice-payment-flow";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { type AppLocale } from "@/i18n/routing";
import {
  fetchInvoiceFromCookies,
  fetchInvoiceGatewayOptionsFromCookies,
} from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function PortalInvoicePaymentPage({
  params,
}: Readonly<{
  params: { locale: string; invoiceId: string };
}>) {
  setRequestLocale(params.locale);

  const cookieHeader = cookies().toString();
  const [t, invoice, gateways] = await Promise.all([
    getTranslations("Billing"),
    fetchInvoiceFromCookies(cookieHeader, params.invoiceId, "client"),
    fetchInvoiceGatewayOptionsFromCookies(cookieHeader, params.invoiceId, "client"),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <PortalShell
      currentPath={`/portal/invoices/${invoice.id}/pay`}
      description={t("payInvoicePageDescription")}
      locale={params.locale as AppLocale}
      title={t("payInvoicePageTitle")}
    >
      <InvoicePaymentFlow invoice={invoice} gateways={gateways ?? []} mode="client" />
    </PortalShell>
  );
}
