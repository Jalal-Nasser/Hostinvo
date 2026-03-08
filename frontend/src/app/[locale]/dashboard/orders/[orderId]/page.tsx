import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PlaceOrderButton } from "@/components/orders/place-order-button";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchOrderFromCookies, formatMinorCurrency } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage({
  params,
}: Readonly<{
  params: { locale: string; orderId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Orders");
  const order = await fetchOrderFromCookies(cookies().toString(), params.orderId);

  if (!order) {
    notFound();
  }

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          {order.status === "draft" ? <PlaceOrderButton orderId={order.id} /> : null}
          <Link
            className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, "/dashboard/orders")}
          >
            {t("backToOrdersButton")}
          </Link>
        </div>
      }
      currentPath={`/dashboard/orders/${order.id}`}
      description={t("detailsDescription")}
      locale={params.locale as AppLocale}
      title={order.reference_number}
    >
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statusLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t(`status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}`)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("clientLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {order.client?.display_name ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("currencyLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{order.currency}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("createdAtLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {new Intl.DateTimeFormat(params.locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(order.created_at))}
              </p>
            </div>
          </div>

          {order.notes ? (
            <div className="mt-6 rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("notesLabel")}</p>
              <p className="mt-3 text-sm leading-7 text-foreground">{order.notes}</p>
            </div>
          ) : null}
        </article>

        <aside className="glass-card p-6 md:p-8">
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("subtotalLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(order.subtotal_minor, order.currency, params.locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("discountLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(order.discount_amount_minor, order.currency, params.locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("taxLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(order.tax_amount_minor, order.currency, params.locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#fffdf8] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("totalLabel")}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatMinorCurrency(order.total_minor, order.currency, params.locale)}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("itemsSection")}</h2>
        <div className="mt-6 grid gap-4">
          {order.items?.map((item, index) => (
            <article
              key={item.id ?? `${item.product_id}-${index}`}
              className="rounded-[1.5rem] border border-line bg-white/80 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">{item.product_name}</p>
                  <p className="mt-2 text-sm text-muted">
                    {t(`billingCycle.${item.billing_cycle}`)} / {t("quantityValue", { value: item.quantity })}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatMinorCurrency(item.total_minor, order.currency, params.locale)}
                </p>
              </div>

              {item.configurable_options && item.configurable_options.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {item.configurable_options.map((option) => (
                    <p key={option.configurable_option_id} className="text-sm text-muted">
                      {option.name}: {option.selected_label}
                    </p>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
