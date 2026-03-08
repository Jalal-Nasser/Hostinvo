import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchInvoiceFromCookies, formatMinorCurrency } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailsPage({
  params,
}: Readonly<{
  params: { locale: string; invoiceId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Billing");
  const invoice = await fetchInvoiceFromCookies(cookies().toString(), params.invoiceId);

  if (!invoice) {
    notFound();
  }

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          {invoice.balance_due_minor > 0 && ["unpaid", "overdue"].includes(invoice.status) ? (
            <Link
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              href={localePath(params.locale, `/dashboard/invoices/${invoice.id}/pay`)}
            >
              {t("payInvoiceButton")}
            </Link>
          ) : null}
          <Link
            className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, `/dashboard/invoices/${invoice.id}/edit`)}
          >
            {t("editInvoiceButton")}
          </Link>
          <Link
            className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, "/dashboard/payments")}
          >
            {t("paymentsHistoryButton")}
          </Link>
        </div>
      }
      currentPath={`/dashboard/invoices/${invoice.id}`}
      description={t("detailsDescription")}
      locale={params.locale as AppLocale}
      title={invoice.reference_number}
    >
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statusLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t(`status${invoice.status.charAt(0).toUpperCase()}${invoice.status.slice(1)}`)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("clientLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {invoice.client?.display_name ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("issueDateLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {invoice.issue_date ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("dueDateLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {invoice.due_date ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("orderLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {invoice.order?.reference_number ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("recurringCycleLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {invoice.recurring_cycle ? t(`billingCycle.${invoice.recurring_cycle}`) : t("notAvailable")}
              </p>
            </div>
          </div>

          {invoice.notes ? (
            <div className="mt-6 rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("notesLabel")}</p>
              <p className="mt-3 text-sm leading-7 text-foreground">{invoice.notes}</p>
            </div>
          ) : null}
        </article>

        <aside className="glass-card p-6 md:p-8">
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("subtotalLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(invoice.subtotal_minor, invoice.currency, params.locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("discountLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(invoice.discount_amount_minor, invoice.currency, params.locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("creditAppliedLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(invoice.credit_applied_minor, invoice.currency, params.locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("taxLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(invoice.tax_amount_minor, invoice.currency, params.locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("amountPaidLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(invoice.amount_paid_minor, invoice.currency, params.locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#fffdf8] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("balanceDueLabel")}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatMinorCurrency(invoice.balance_due_minor, invoice.currency, params.locale)}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("itemsSection")}</h2>
        <div className="mt-6 grid gap-4">
          {invoice.items?.map((item, index) => (
            <article
              key={item.id ?? `${item.description}-${index}`}
              className="rounded-[1.5rem] border border-line bg-white/80 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">{item.description}</p>
                  <p className="mt-2 text-sm text-muted">
                    {item.billing_cycle ? t(`billingCycle.${item.billing_cycle}`) : t("notAvailable")} /{" "}
                    {t("quantityValue", { value: item.quantity })}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatMinorCurrency(item.total_minor, invoice.currency, params.locale)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("paymentsSection")}</h2>
          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {invoice.payments.map((payment) => (
                <div key={payment.id} className="rounded-[1.5rem] border border-line bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{payment.reference ?? payment.payment_method}</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatMinorCurrency(payment.amount_minor, payment.currency, params.locale)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {t(`paymentType${payment.type.charAt(0).toUpperCase()}${payment.type.slice(1)}`)} /{" "}
                    {t(`paymentStatus${payment.status.charAt(0).toUpperCase()}${payment.status.slice(1)}`)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("noPayments")}</p>
          )}
        </article>

        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("transactionsSection")}</h2>
          {invoice.transactions && invoice.transactions.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {invoice.transactions.map((transaction) => (
                <div key={transaction.id} className="rounded-[1.5rem] border border-line bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {transaction.external_reference ?? transaction.gateway}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatMinorCurrency(transaction.amount_minor, transaction.currency, params.locale)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {t(`paymentType${transaction.type.charAt(0).toUpperCase()}${transaction.type.slice(1)}`)} /{" "}
                    {t(`paymentStatus${transaction.status.charAt(0).toUpperCase()}${transaction.status.slice(1)}`)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("noTransactions")}</p>
          )}
        </article>
      </section>
    </DashboardShell>
  );
}
