import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { PortalPagination } from "@/components/portal/portal-pagination";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchInvoicesFromCookies,
  formatMinorCurrency,
} from "@/lib/billing";

export const dynamic = "force-dynamic";

function formatDate(locale: string, value: string | null): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function invoiceStatusLabel(
  status: string,
  t: (key: string) => string,
): string {
  const key = `status${status.charAt(0).toUpperCase()}${status.slice(1)}`;

  return t(key);
}

export default async function PortalInvoicesPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { search?: string; status?: string; page?: string };
}>) {
  setRequestLocale(params.locale);

  const [portalT, billingT] = await Promise.all([
    getTranslations("Portal"),
    getTranslations("Billing"),
  ]);
  const invoicesResponse = await fetchInvoicesFromCookies(
    cookies().toString(),
    {
      page: searchParams?.page,
      search: searchParams?.search,
      status: searchParams?.status,
    },
    "client",
  );
  const invoices = invoicesResponse?.data ?? [];
  const invoicesMeta = invoicesResponse?.meta;

  return (
    <PortalShell
      currentPath="/portal/invoices"
      description={portalT("portalInvoicesPageDescription")}
      locale={params.locale as AppLocale}
      title={portalT("invoicesPageTitle")}
    >
      <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
        <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-[#dfe7f7]">
            <span>{billingT("searchLabel")}</span>
            <input
              className={portalTheme.fieldClass}
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={billingT("searchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[#dfe7f7]">
            <span>{billingT("statusLabel")}</span>
            <select
              className={portalTheme.fieldClass}
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{billingT("allStatuses")}</option>
              {["draft", "unpaid", "paid", "overdue", "cancelled", "refunded"].map((status) => (
                <option key={status} value={status}>
                  {invoiceStatusLabel(status, billingT)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button className={portalTheme.primaryButtonClass} type="submit">
              {billingT("searchButton")}
            </button>
            <Link
              className={portalTheme.secondaryButtonClass}
              href={localePath(params.locale, "/portal/invoices")}
            >
              {billingT("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {invoices.length === 0 ? (
        <section className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <h2 className="text-xl font-semibold text-white">
            {portalT("portalInvoicesEmptyTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aebad4]">
            {portalT("portalInvoicesEmptyDescription")}
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          <section className="grid gap-4">
            {invoices.map((invoice) => (
              <article
                key={invoice.id}
                className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-white">
                        {invoice.reference_number}
                      </h2>
                      <span className="rounded-full bg-[rgba(52,134,255,0.12)] ps-3 pe-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#dfe9ff]">
                        {invoiceStatusLabel(invoice.status, billingT)}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-[#aebad4] md:grid-cols-2 xl:grid-cols-4">
                      <p>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                          {portalT("invoiceAmountLabel")}
                        </span>
                        <span className="mt-2 block font-semibold text-white">
                          {formatMinorCurrency(invoice.total_minor, invoice.currency, params.locale)}
                        </span>
                      </p>
                      <p>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                          {billingT("dueDateLabel")}
                        </span>
                        <span className="mt-2 block font-semibold text-white">
                          {formatDate(params.locale, invoice.due_date) ?? portalT("notAvailable")}
                        </span>
                      </p>
                      <p>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                          {portalT("invoicePaidDateLabel")}
                        </span>
                        <span className="mt-2 block font-semibold text-white">
                          {formatDate(params.locale, invoice.paid_at) ?? portalT("notAvailable")}
                        </span>
                      </p>
                      <p>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                          {billingT("currencyLabel")}
                        </span>
                        <span className="mt-2 block font-semibold text-white">
                          {invoice.currency}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      className={portalTheme.secondaryButtonClass}
                      href={localePath(params.locale, `/portal/invoices/${invoice.id}`)}
                    >
                      {billingT("viewDetailsButton")}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {invoicesMeta ? (
            <PortalPagination
              currentPage={invoicesMeta.current_page}
              lastPage={invoicesMeta.last_page}
              locale={params.locale}
              nextLabel={portalT("paginationNext")}
              path="/portal/invoices"
              previousLabel={portalT("paginationPrevious")}
              query={{
                page: searchParams?.page,
                search: searchParams?.search,
                status: searchParams?.status,
              }}
              summaryLabel={portalT("paginationSummary")}
              total={invoicesMeta.total}
            />
          ) : null}
        </div>
      )}
    </PortalShell>
  );
}
