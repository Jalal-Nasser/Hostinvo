"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import { billingCycles, type BillingCycle, type ProductRecord } from "@/lib/catalog";

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

  const cycleLabels: Record<BillingCycle, string> = {
    monthly: t("billingCycleMonthly"),
    quarterly: t("billingCycleQuarterly"),
    semiannually: t("billingCycleSemiannually"),
    annually: t("billingCycleAnnually"),
    biennially: t("billingCycleBiennially"),
    triennially: t("billingCycleTriennially"),
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
        const response = await fetch(
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

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
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
        <div className="grid gap-4">
          {billingCycles.map((cycle) => (
            <article
              key={cycle}
              className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{cycleLabels[cycle]}</h2>
                  <p className="mt-2 text-sm text-muted">{t("pricingRowDescription")}</p>
                </div>

                <label className="flex items-center gap-3 text-sm text-muted">
                  <input
                    checked={pricing[cycle].is_enabled}
                    className="h-4 w-4 rounded border-line"
                    onChange={(event) => updateCycle(cycle, "is_enabled", event.target.checked)}
                    type="checkbox"
                  />
                  <span>{t("enabledLabel")}</span>
                </label>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("currencyLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 uppercase outline-none transition focus:border-accent"
                    maxLength={3}
                    onChange={(event) => updateCycle(cycle, "currency", event.target.value)}
                    value={pricing[cycle].currency}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("priceLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                    min={0}
                    onChange={(event) => updateCycle(cycle, "price", event.target.value)}
                    step="0.01"
                    type="number"
                    value={pricing[cycle].price}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("setupFeeLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                    min={0}
                    onChange={(event) => updateCycle(cycle, "setup_fee", event.target.value)}
                    step="0.01"
                    type="number"
                    value={pricing[cycle].setup_fee}
                  />
                </label>
              </div>
            </article>
          ))}
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
