import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchPaymentsFromCookies, formatMinorCurrency } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { search?: string; type?: string; status?: string; page?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Billing");
  const response = await fetchPaymentsFromCookies(cookies().toString(), {
    search: searchParams?.search,
    type: searchParams?.type,
    status: searchParams?.status,
    page: searchParams?.page,
  });

  const payments = response?.data ?? [];

  return (
    <DashboardShell
      currentPath="/dashboard/payments"
      description={t("paymentsDescription")}
      locale={params.locale as AppLocale}
      title={t("paymentsTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("searchLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("paymentsSearchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("paymentTypeLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.type ?? ""}
              name="type"
            >
              <option value="">{t("allPaymentTypes")}</option>
              <option value="payment">{t("paymentTypePayment")}</option>
              <option value="refund">{t("paymentTypeRefund")}</option>
              <option value="credit">{t("paymentTypeCredit")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("paymentStatusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allPaymentStatuses")}</option>
              <option value="pending">{t("paymentStatusPending")}</option>
              <option value="completed">{t("paymentStatusCompleted")}</option>
              <option value="failed">{t("paymentStatusFailed")}</option>
              <option value="cancelled">{t("paymentStatusCancelled")}</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              type="submit"
            >
              {t("searchButton")}
            </button>

            <Link
              className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
              href={localePath(params.locale, "/dashboard/payments")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {payments.length === 0 ? (
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("paymentsEmptyTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("paymentsEmptyDescription")}</p>
        </section>
      ) : (
        <section className="grid gap-4">
          {payments.map((payment) => (
            <article key={payment.id} className="glass-card p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">
                      {payment.reference ?? payment.payment_method}
                    </h2>
                    <span className="rounded-full border border-line bg-[#faf9f5]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {t(`paymentStatus${payment.status.charAt(0).toUpperCase()}${payment.status.slice(1)}`)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">{payment.client?.display_name ?? t("notAvailable")}</p>
                  <p className="mt-2 text-sm text-muted">{payment.invoice?.reference_number ?? t("notAvailable")}</p>
                </div>

                <p className="text-sm font-semibold text-foreground">
                  {formatMinorCurrency(payment.amount_minor, payment.currency, params.locale)}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
