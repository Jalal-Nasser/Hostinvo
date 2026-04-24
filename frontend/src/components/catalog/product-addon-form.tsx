"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import { billingCycles, type ProductRecord } from "@/lib/catalog";
import {
  productAddonStatuses,
  productAddonVisibility,
  type ProductAddonRecord,
  type ProductAddonStatus,
  type ProductAddonVisibility,
} from "@/lib/product-addons";

type ProductAddonFormProps = {
  mode: "create" | "edit";
  products: ProductRecord[];
  initialAddon?: ProductAddonRecord;
};

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

type PricingState = Record<
  (typeof billingCycles)[number],
  {
    currency: string;
    price: string;
    setup_fee: string;
    is_enabled: boolean;
  }
>;

function buildInitialPricing(addon?: ProductAddonRecord): PricingState {
  const rows = new Map(
    (addon?.pricing ?? []).map((row) => [
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
    accumulator[cycle] = rows.get(cycle) ?? {
      currency: addon?.starting_price?.currency ?? "USD",
      price: "0.00",
      setup_fee: "0.00",
      is_enabled: false,
    };

    return accumulator;
  }, {} as PricingState);
}

export function ProductAddonForm({ mode, products, initialAddon }: ProductAddonFormProps) {
  const t = useTranslations("Catalog");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialAddon?.name ?? "");
  const [slug, setSlug] = useState(initialAddon?.slug ?? "");
  const [description, setDescription] = useState(initialAddon?.description ?? "");
  const [status, setStatus] = useState<ProductAddonStatus>(initialAddon?.status ?? "active");
  const [visibility, setVisibility] = useState<ProductAddonVisibility>(initialAddon?.visibility ?? "visible");
  const [applyTax, setApplyTax] = useState(initialAddon?.apply_tax ?? false);
  const [autoActivate, setAutoActivate] = useState(initialAddon?.auto_activate ?? false);
  const [welcomeEmail, setWelcomeEmail] = useState(initialAddon?.welcome_email ?? "");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(initialAddon?.products?.map((product) => product.id) ?? []);
  const [pricing, setPricing] = useState<PricingState>(buildInitialPricing(initialAddon));

  function toggleProduct(productId: string) {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((item) => item !== productId)
        : [...current, productId],
    );
  }

  function updatePricing(
    cycle: (typeof billingCycles)[number],
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
          mode === "create"
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/product-addons`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/product-addons/${initialAddon?.id}`,
          {
            method: mode === "create" ? "POST" : "PUT",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify({
              name,
              slug: slug.trim() || null,
              description: description.trim() || null,
              status,
              visibility,
              apply_tax: applyTax,
              auto_activate: autoActivate,
              welcome_email: welcomeEmail.trim() || null,
              product_ids: selectedProductIds,
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
          const payload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          const firstError = payload?.message ?? Object.values(payload?.errors ?? {})[0]?.[0] ?? t("saveError");
          setError(firstError);
          return;
        }

        if (mode === "create") {
          const payload = (await response.json()) as { data: ProductAddonRecord };
          router.replace(localePath(locale, `/dashboard/product-addons/${payload.data.id}/edit`));
          router.refresh();
          return;
        }

        setMessage(t("addonSaveSuccess"));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("addonNameLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("slugLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setSlug(event.target.value)}
              value={slug}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("descriptionLabel")}</span>
            <textarea
              className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setStatus(event.target.value as ProductAddonStatus)}
              value={status}
            >
              {productAddonStatuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("visibilityLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setVisibility(event.target.value as ProductAddonVisibility)}
              value={visibility}
            >
              {productAddonVisibility.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("welcomeEmailLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setWelcomeEmail(event.target.value)}
              value={welcomeEmail}
            />
          </label>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 text-sm text-muted">
            <input checked={applyTax} onChange={(event) => setApplyTax(event.target.checked)} type="checkbox" />
            <span>{t("applyTaxLabel")}</span>
          </label>
          <label className="flex items-center gap-3 text-sm text-muted">
            <input checked={autoActivate} onChange={(event) => setAutoActivate(event.target.checked)} type="checkbox" />
            <span>{t("addonAutoActivateLabel")}</span>
          </label>
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("addonApplicableProductsTitle")}</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <label key={product.id} className="flex items-center gap-3 rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 text-sm text-foreground">
              <input
                checked={selectedProductIds.includes(product.id)}
                onChange={() => toggleProduct(product.id)}
                type="checkbox"
              />
              <span>{product.name}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("tabPricing")}</h2>
        <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-line bg-[#faf9f5]/80">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f3f4f6] text-left text-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("pricingMetricLabel")}</th>
                {billingCycles.map((cycle) => (
                  <th key={cycle} className="px-4 py-3 font-semibold">{t(`billingCycle${cycle.charAt(0).toUpperCase()}${cycle.slice(1)}`)}</th>
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
                      onChange={(event) => updatePricing(cycle, "currency", event.target.value)}
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
                      onChange={(event) => updatePricing(cycle, "setup_fee", event.target.value)}
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
                      onChange={(event) => updatePricing(cycle, "price", event.target.value)}
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
                      onChange={(event) => updatePricing(cycle, "is_enabled", event.target.checked)}
                      type="checkbox"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={handleSubmit}
          type="button"
        >
          {isPending ? t("saving") : t("saveButton")}
        </button>

        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(locale, "/dashboard/product-addons")}
        >
          {t("backToAddons")}
        </Link>
      </div>
    </div>
  );
}
