import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchOrdersFromCookies, formatMinorCurrency } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { search?: string; status?: string; page?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Orders");
  const response = await fetchOrdersFromCookies(cookies().toString(), {
    search: searchParams?.search,
    status: searchParams?.status,
    page: searchParams?.page,
  });

  const orders = response?.data ?? [];

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/orders/new")}
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {t("newOrderButton")}
        </Link>
      }
      currentPath="/dashboard/orders"
      description={t("listDescription")}
      locale={params.locale as AppLocale}
      title={t("listTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("searchLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("searchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="draft">{t("statusDraft")}</option>
              <option value="pending">{t("statusPending")}</option>
              <option value="accepted">{t("statusAccepted")}</option>
              <option value="cancelled">{t("statusCancelled")}</option>
              <option value="fraud">{t("statusFraud")}</option>
              <option value="completed">{t("statusCompleted")}</option>
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
              href={localePath(params.locale, "/dashboard/orders")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {orders.length === 0 ? (
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("emptyStateTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("emptyStateDescription")}</p>
        </section>
      ) : (
        <section className="grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="glass-card p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">{order.reference_number}</h2>
                    <span className="rounded-full border border-line bg-[#faf9f5]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {t(`status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}`)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">{order.client?.display_name ?? t("notAvailable")}</p>
                  <p className="mt-2 text-sm text-muted">{order.client?.email ?? t("notAvailable")}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/dashboard/orders/${order.id}`)}
                  >
                    {t("viewDetailsButton")}
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("itemsCountLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{order.items_count ?? 0}</p>
                </div>
                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("subtotalLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatMinorCurrency(order.subtotal_minor, order.currency, params.locale)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("totalLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatMinorCurrency(order.total_minor, order.currency, params.locale)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
