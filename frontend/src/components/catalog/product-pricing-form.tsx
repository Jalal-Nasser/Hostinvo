"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import {
  billingCycles,
  productPaymentTypes,
  productQuantityModes,
  type BillingCycle,
  type ProductPaymentType,
  type ProductQuantityMode,
  type ProductRecord,
} from "@/lib/catalog";

type ProductPricingFormProps = {
  product: ProductRecord;
};

type PricingState = Record<
  BillingCycle,
  {
    currency: string;
    price: string;
    setup_fee: string;
    is_enabled: boolean;
  }
>;

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

async function ensureCsrfCookie() {
  await fetch(`${backendOrigin}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}

function firstErrorFromPayload(payload: {
  message?: string;
  errors?: Record<string, string[]>;
} | null) {
  if (payload?.message) {
    return payload.message;
  }

  if (!payload?.errors) {
    return null;
  }

  const firstField = Object.values(payload.errors)[0];

  return firstField?.[0] ?? null;
}

function buildInitialPricing(product: ProductRecord): PricingState {
  const existing = new Map(
    (product.pricing ?? []).map((row) => [
      row.billing_cycle,
      {
        currency: row.currency,
        price: row.price,
        setup_fee: row.setup_fee,
        is_enabled: row.is_enabled,
      },
    ]),
  );

  return billingCycles.reduce((accumulator, cycle) => {
    accumulator[cycle] =
      existing.get(cycle) ?? {
        currency: product.starting_price?.currency ?? "USD",
        price: "0.00",
        setup_fee: "0.00",
        is_enabled: false,
      };

    return accumulator;
  }, {} as PricingState);
}

export function ProductPricingForm({ product }: ProductPricingFormProps) {
  const t = useTranslations("Catalog");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingState>(buildInitialPricing(product));
  const [paymentType, setPaymentType] = useState<ProductPaymentType>(product.payment_type);
  const [quantityMode, setQuantityMode] = useState<ProductQuantityMode>(
    product.allow_multiple_quantities,
  );
  const [recurringCyclesLimit, setRecurringCyclesLimit] = useState(product.recurring_cycles_limit ?? 0);
  const [autoTerminateDays, setAutoTerminateDays] = useState(product.auto_terminate_days ?? 0);
  const [terminationEmail, setTerminationEmail] = useState(product.termination_email ?? "");
  const [prorataBilling, setProrataBilling] = useState(product.prorata_billing);
  const [prorataDate, setProrataDate] = useState(product.prorata_date ?? 1);
  const [chargeNextMonth, setChargeNextMonth] = useState(product.charge_next_month ?? 0);

  const cycleLabels: Record<BillingCycle, string> = {
    monthly: t("billingCycleMonthly"),
    quarterly: t("billingCycleQuarterly"),
    semiannually: t("billingCycleSemiannually"),
    annually: t("billingCycleAnnually"),
    biennially: t("billingCycleBiennially"),
    triennially: t("billingCycleTriennially"),
  };
  const paymentTypeLabels: Record<ProductPaymentType, string> = {
    free: t("paymentTypeFree"),
    onetime: t("paymentTypeOneTime"),
    recurring: t("paymentTypeRecurring"),
  };
  const quantityModeLabels: Record<ProductQuantityMode, string> = {
    no: t("quantityModeNo"),
    multiple_services: t("quantityModeMultipleServices"),
    scalable: t("quantityModeScalable"),
  };

  function updateCycle(
    cycle: BillingCycle,
    field: "currency" | "price" | "setup_fee" | "is_enabled",
    value: string | boolean,
  ) {
    setPricing((current) => ({
      ...current,
      [cycle]: {
        ...current[cycle],
        [field]: value,
      },
    }));
  }

  function handleSubmit() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const productResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/${product.id}`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify({
              product_group_id: product.product_group_id,
              server_id: product.server_id,
              type: product.type,
              provisioning_module: product.provisioning_module,
              provisioning_package: product.provisioning_package,
              name: product.name,
              tagline: product.tagline,
              slug: product.slug,
              sku: product.sku,
              summary: product.summary,
              description: product.description,
              color: product.color,
              welcome_email: product.welcome_email,
              require_domain: product.require_domain,
              stock_control: product.stock_control,
              stock_quantity: product.stock_quantity,
              apply_tax: product.apply_tax,
              retired: product.retired,
              payment_type: paymentType,
              allow_multiple_quantities: quantityMode,
              recurring_cycles_limit:
                paymentType === "recurring" ? recurringCyclesLimit : null,
              auto_terminate_days: autoTerminateDays,
              termination_email: terminationEmail || null,
              prorata_billing: prorataBilling,
              prorata_date: prorataBilling ? prorataDate : null,
              charge_next_month: prorataBilling ? chargeNextMonth : null,
              status: product.status,
              visibility: product.visibility,
              display_order: product.display_order,
              is_featured: product.is_featured,
              configurable_options: (product.configurable_options ?? []).map((option) => ({
                id: option.id,
                name: option.name,
                code: option.code,
                option_type: option.option_type,
                description: option.description ?? null,
                status: option.status,
                is_required: option.is_required,
                display_order: option.display_order,
                choices: option.choices.map((choice) => ({
                  id: choice.id,
                  label: choice.label,
                  value: choice.value,
                  is_default: choice.is_default,
                  display_order: choice.display_order,
                })),
              })),
            }),
          },
        );

        if (!productResponse.ok) {
          const errorPayload = (await productResponse.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("saveError"));
          return;
        }

        const pricingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/${product.id}/pricing`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify({
              pricing: billingCycles.map((cycle) => ({
                billing_cycle: cycle,
                currency: pricing[cycle].currency.trim().toUpperCase(),
                price: Number(pricing[cycle].price || 0),
                setup_fee: Number(pricing[cycle].setup_fee || 0),
                is_enabled: pricing[cycle].is_enabled,
              })),
            }),
          },
        );

        if (!pricingResponse.ok) {
          const errorPayload = (await pricingResponse.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("saveError"));
          return;
        }

        setMessage(t("pricingUpdateSuccess"));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{t("paymentTypeLabel")}</span>
              <div className="flex flex-wrap gap-4 rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3">
                {productPaymentTypes.map((value) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-foreground">
                    <input checked={paymentType === value} onChange={() => setPaymentType(value)} type="radio" />
                    <span>{paymentTypeLabels[value]}</span>
                  </label>
                ))}
              </div>
            </label>
          </div>

          <div className="overflow-x-auto rounded-[1.5rem] border border-line bg-[#faf9f5]/80">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f3f4f6] text-left text-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("pricingMetricLabel")}</th>
                  {billingCycles.map((cycle) => (
                    <th key={cycle} className="px-4 py-3 font-semibold">{cycleLabels[cycle]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-foreground">{t("currencyLabel")}</td>
                  {billingCycles.map((cycle) => (
                    <td key={cycle} className="px-4 py-3">
                      <input
                        className="w-24 rounded-xl border border-line bg-white px-3 py-2 uppercase outline-none transition focus:border-accent"
                        maxLength={3}
                        onChange={(event) => updateCycle(cycle, "currency", event.target.value)}
                        value={pricing[cycle].currency}
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-foreground">{t("setupFeeLabel")}</td>
                  {billingCycles.map((cycle) => (
                    <td key={cycle} className="px-4 py-3">
                      <input
                        className="w-28 rounded-xl border border-line bg-white px-3 py-2 outline-none transition focus:border-accent"
                        min={0}
                        onChange={(event) => updateCycle(cycle, "setup_fee", event.target.value)}
                        step="0.01"
                        type="number"
                        value={pricing[cycle].setup_fee}
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-foreground">{t("priceLabel")}</td>
                  {billingCycles.map((cycle) => (
                    <td key={cycle} className="px-4 py-3">
                      <input
                        className="w-28 rounded-xl border border-line bg-white px-3 py-2 outline-none transition focus:border-accent"
                        min={0}
                        onChange={(event) => updateCycle(cycle, "price", event.target.value)}
                        step="0.01"
                        type="number"
                        value={pricing[cycle].price}
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-foreground">{t("enabledLabel")}</td>
                  {billingCycles.map((cycle) => (
                    <td key={cycle} className="px-4 py-3">
                      <input
                        checked={pricing[cycle].is_enabled}
                        className="h-4 w-4 rounded border-line"
                        onChange={(event) => updateCycle(cycle, "is_enabled", event.target.checked)}
                        type="checkbox"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
              <span>{t("quantityModeLabel")}</span>
              <div className="grid gap-2 rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3">
                {productQuantityModes.map((value) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-foreground">
                    <input checked={quantityMode === value} onChange={() => setQuantityMode(value)} type="radio" />
                    <span>{quantityModeLabels[value]}</span>
                  </label>
                ))}
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{t("recurringCyclesLimitLabel")}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                min={0}
                onChange={(event) => setRecurringCyclesLimit(Number(event.target.value) || 0)}
                type="number"
                value={recurringCyclesLimit}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{t("autoTerminateDaysLabel")}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                min={0}
                onChange={(event) => setAutoTerminateDays(Number(event.target.value) || 0)}
                type="number"
                value={autoTerminateDays}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{t("terminationEmailLabel")}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                onChange={(event) => setTerminationEmail(event.target.value)}
                value={terminationEmail}
              />
            </label>

            <label className="flex items-center gap-3 text-sm text-muted">
              <input
                checked={prorataBilling}
                className="h-4 w-4 rounded border-line"
                onChange={(event) => setProrataBilling(event.target.checked)}
                type="checkbox"
              />
              <span>{t("prorataBillingLabel")}</span>
            </label>

            {prorataBilling ? (
              <>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("prorataDateLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                    max={31}
                    min={1}
                    onChange={(event) => setProrataDate(Number(event.target.value) || 1)}
                    type="number"
                    value={prorataDate}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("chargeNextMonthLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                    max={31}
                    min={0}
                    onChange={(event) => setChargeNextMonth(Number(event.target.value) || 0)}
                    type="number"
                    value={chargeNextMonth}
                  />
                </label>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={handleSubmit}
          type="button"
        >
          {isPending ? t("saving") : t("savePricingButton")}
        </button>

        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(locale, `/dashboard/products/${product.id}/edit`)}
        >
          {t("editProductButton")}
        </Link>

        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(locale, "/dashboard/products")}
        >
          {t("backToProducts")}
        </Link>
      </div>
    </div>
  );
}
