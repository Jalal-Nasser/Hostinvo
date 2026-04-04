import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchInvoiceFromCookies,
  formatMinorCurrency,
} from "@/lib/billing";

export const dynamic = "force-dynamic";

function formatDate(locale: string, value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(new Date(value));
}

function invoiceStatusLabel(
  status: string,
  t: (key: string) => string,
): string {
  const key = `status${status.charAt(0).toUpperCase()}${status.slice(1)}`;

  return t(key);
}

export default async function PortalInvoiceDetailsPage({
  params,
}: Readonly<{
  params: { locale: string; invoiceId: string };
}>) {
  setRequestLocale(params.locale);

  const [portalT, billingT, supportT] = await Promise.all([
    getTranslations("Portal"),
    getTranslations("Billing"),
    getTranslations("Support"),
  ]);
  const invoice = await fetchInvoiceFromCookies(
    cookies().toString(),
    params.invoiceId,
    "client",
  );

  if (!invoice) {
    notFound();
  }

  const showDisabledPayAction =
    invoice.balance_due_minor > 0 &&
    ["unpaid", "overdue"].includes(invoice.status);

  return (
    <PortalShell
      actions={
        <div className="flex flex-wrap gap-3">
          {showDisabledPayAction ? (
            <span
              className={[
                portalTheme.primaryButtonClass,
                "cursor-not-allowed opacity-60",
              ].join(" ")}
            >
              {billingT("payInvoiceButton")}
            </span>
          ) : null}
          <Link
            className={portalTheme.secondaryButtonClass}
            href={localePath(params.locale, `/portal/tickets/new`)}
          >
            {supportT("newTicketButton")}
          </Link>
          <Link
            className={portalTheme.secondaryButtonClass}
            href={localePath(params.locale, "/portal/invoices")}
          >
            {portalT("backToInvoicesButton")}
          </Link>
        </div>
      }
      currentPath={`/portal/invoices/${invoice.id}`}
      description={portalT("portalInvoiceDetailsDescription")}
      locale={params.locale as AppLocale}
      title={invoice.reference_number}
    >
      {showDisabledPayAction ? (
        <div className={portalTheme.noteClass}>
          {portalT("portalInvoicePaymentUnavailableNotice")}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={[portalTheme.subtleSurfaceClass, "p-5 md:col-span-2"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {billingT("statusLabel")}
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {invoiceStatusLabel(invoice.status, billingT)}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {billingT("issueDateLabel")}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {formatDate(params.locale, invoice.issue_date) ?? portalT("notAvailable")}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {billingT("dueDateLabel")}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {formatDate(params.locale, invoice.due_date) ?? portalT("notAvailable")}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {portalT("invoicePaidDateLabel")}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {formatDate(params.locale, invoice.paid_at) ?? portalT("notAvailable")}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {billingT("clientLabel")}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {invoice.client?.display_name ?? portalT("notAvailable")}
              </p>
            </div>
          </div>

          {invoice.notes ? (
            <div className={[portalTheme.subtleSurfaceClass, "mt-5 p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {billingT("notesLabel")}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#d8e3f9]">
                {invoice.notes}
              </p>
            </div>
          ) : null}
        </article>

        <aside className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <div className="grid gap-4">
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {billingT("subtotalLabel")}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {formatMinorCurrency(invoice.subtotal_minor, invoice.currency, params.locale)}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {billingT("taxLabel")}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {formatMinorCurrency(invoice.tax_amount_minor, invoice.currency, params.locale)}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {billingT("amountPaidLabel")}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {formatMinorCurrency(invoice.amount_paid_minor, invoice.currency, params.locale)}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {billingT("balanceDueLabel")}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatMinorCurrency(invoice.balance_due_minor, invoice.currency, params.locale)}
              </p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {billingT("totalLabel")}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatMinorCurrency(invoice.total_minor, invoice.currency, params.locale)}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
        <h2 className="text-xl font-semibold text-white">{billingT("itemsSection")}</h2>
        {invoice.items && invoice.items.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {invoice.items.map((item, index) => (
              <article
                key={item.id ?? `${item.description}-${index}`}
                className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">{item.description}</h3>
                    <p className="mt-2 text-sm text-[#aebad4]">
                      {billingT("quantityLabel")}: {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {formatMinorCurrency(item.total_minor, invoice.currency, params.locale)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-[#aebad4]">
            {portalT("portalInvoiceItemsEmpty")}
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <h2 className="text-xl font-semibold text-white">{billingT("paymentsSection")}</h2>
          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {invoice.payments.map((payment) => (
                <div key={payment.id} className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">
                      {payment.reference ?? payment.payment_method}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatMinorCurrency(payment.amount_minor, payment.currency, params.locale)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[#aebad4]">
                    {formatDate(params.locale, payment.paid_at) ?? portalT("notAvailable")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-[#aebad4]">{billingT("noPayments")}</p>
          )}
        </article>

        <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <h2 className="text-xl font-semibold text-white">{billingT("transactionsSection")}</h2>
          {invoice.transactions && invoice.transactions.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {invoice.transactions.map((transaction) => (
                <div key={transaction.id} className={[portalTheme.subtleSurfaceClass, "p-4"].join(" ")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">
                      {transaction.external_reference ?? transaction.gateway}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatMinorCurrency(transaction.amount_minor, transaction.currency, params.locale)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[#aebad4]">
                    {formatDate(params.locale, transaction.occurred_at) ?? portalT("notAvailable")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-[#aebad4]">{billingT("noTransactions")}</p>
          )}
        </article>
      </section>
    </PortalShell>
  );
}
