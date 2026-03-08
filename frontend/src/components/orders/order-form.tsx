"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import { type ClientRecord } from "@/lib/clients";
import { type BillingCycle, type ProductRecord } from "@/lib/catalog";
import {
  decimalToMinor,
  discountTypes,
  orderDraftStorageKey,
  percentToBps,
  type DiscountType,
  type OrderFormPayload,
  type OrderItemSelectionPayload,
} from "@/lib/orders";

type OrderFormProps = {
  clients: ClientRecord[];
  products: ProductRecord[];
};

type OrderItemState = {
  product_id: string;
  billing_cycle: BillingCycle | "";
  quantity: number;
  configurable_options: OrderItemSelectionPayload[];
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

function nullable(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  return normalized === "" ? null : normalized;
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

function emptyItem(): OrderItemState {
  return {
    product_id: "",
    billing_cycle: "",
    quantity: 1,
    configurable_options: [],
  };
}

function isSelectionPayload(
  value: OrderItemSelectionPayload | null,
): value is OrderItemSelectionPayload {
  return value !== null;
}

async function fetchProductDetails(productId: string): Promise<ProductRecord | null> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/${productId}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: ProductRecord };

  return payload.data;
}

function defaultSelections(product: ProductRecord): OrderItemSelectionPayload[] {
  return (product.configurable_options ?? [])
    .map((option): OrderItemSelectionPayload | null => {
      if (!option.id) {
        return null;
      }

      if (option.option_type === "select" || option.option_type === "radio") {
        const defaultChoice =
          option.choices.find((choice) => choice.is_default) ?? option.choices[0];

        if (!defaultChoice) {
          return null;
        }

        return {
          configurable_option_id: option.id,
          selected_value: defaultChoice.value,
        };
      }

      if (option.option_type === "quantity") {
        return {
          configurable_option_id: option.id,
          selected_value: option.is_required ? 1 : 0,
        };
      }

      if (option.option_type === "yes_no") {
        return {
          configurable_option_id: option.id,
          selected_value: false,
        };
      }

      return null;
    })
    .filter(isSelectionPayload);
}

export function OrderForm({ clients, products }: OrderFormProps) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType | "">("");
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItemState[]>([emptyItem()]);
  const [loadedProducts, setLoadedProducts] = useState<Record<string, ProductRecord>>({});

  async function handleProductChange(index: number, productId: string) {
    const summaryProduct = products.find((product) => product.id === productId);
    let detail: ProductRecord | null = loadedProducts[productId] ?? null;

    if (!detail && productId) {
      detail = await fetchProductDetails(productId);

      if (detail) {
        const resolvedDetail = detail;
        setLoadedProducts((current) => ({
          ...current,
          [productId]: resolvedDetail,
        }));
      }
    }

    const sourceProduct = detail ?? summaryProduct;
    const firstEnabledCycle =
      sourceProduct?.pricing?.find((pricing) => pricing.is_enabled)?.billing_cycle ?? "";
    const defaultOptionSelections = detail ? defaultSelections(detail) : [];

    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              product_id: productId,
              billing_cycle: firstEnabledCycle,
              quantity: 1,
              configurable_options: defaultOptionSelections,
            }
          : item,
      ),
    );
  }

  function updateItem(index: number, updates: Partial<OrderItemState>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item)),
    );
  }

  function updateSelection(
    itemIndex: number,
    configurableOptionId: string,
    selectedValue: string | number | boolean | null,
  ) {
    setItems((current) =>
      current.map((item, currentIndex) => {
        if (currentIndex !== itemIndex) {
          return item;
        }

        const existing = item.configurable_options.find(
          (selection) => selection.configurable_option_id === configurableOptionId,
        );

        if (!existing) {
          return {
            ...item,
            configurable_options: [
              ...item.configurable_options,
              {
                configurable_option_id: configurableOptionId,
                selected_value: selectedValue,
              },
            ],
          };
        }

        return {
          ...item,
          configurable_options: item.configurable_options.map((selection) =>
            selection.configurable_option_id === configurableOptionId
              ? { ...selection, selected_value: selectedValue }
              : selection,
          ),
        };
      }),
    );
  }

  function selectedClient() {
    return clients.find((client) => client.id === clientId) ?? null;
  }

  function normalizePayload(): OrderFormPayload {
    const client = selectedClient();

    return {
      client_id: clientId,
      currency: (currency || client?.currency || "USD").trim().toUpperCase(),
      coupon_code: nullable(couponCode),
      discount_type: discountType || null,
      discount_value:
        discountType === "fixed"
          ? decimalToMinor(discountValue)
          : discountType === "percentage"
            ? percentToBps(discountValue)
            : null,
      tax_rate_bps: percentToBps(taxRate),
      notes: nullable(notes),
      items: items
        .filter((item) => item.product_id && item.billing_cycle)
        .map((item) => ({
          product_id: item.product_id,
          billing_cycle: item.billing_cycle as BillingCycle,
          quantity: item.quantity,
          configurable_options: item.configurable_options,
        })),
    };
  }

  function saveDraft() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
          },
          body: JSON.stringify(normalizePayload()),
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("saveError"));
          return;
        }

        const payload = (await response.json()) as { data: { id: string } };
        sessionStorage.removeItem(orderDraftStorageKey);
        router.replace(localePath(locale, `/dashboard/orders/${payload.data.id}`));
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  function reviewCheckout() {
    try {
      sessionStorage.setItem(orderDraftStorageKey, JSON.stringify(normalizePayload()));
      router.push(localePath(locale, "/dashboard/orders/checkout-review"));
    } catch {
      setError(t("draftStorageError"));
    }
  }

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("clientLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => {
                const nextClientId = event.target.value;
                const client = clients.find((item) => item.id === nextClientId);
                setClientId(nextClientId);
                setCurrency(client?.currency ?? "USD");
              }}
              value={clientId}
            >
              <option value="">{t("selectClientPlaceholder")}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.display_name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("currencyLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 uppercase outline-none transition focus:border-accent"
              maxLength={3}
              onChange={(event) => setCurrency(event.target.value)}
              value={currency}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("couponCodeLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setCouponCode(event.target.value)}
              value={couponCode}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("discountTypeLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setDiscountType(event.target.value as DiscountType | "")}
              value={discountType}
            >
              <option value="">{t("noDiscountOption")}</option>
              {discountTypes.map((value) => (
                <option key={value} value={value}>
                  {value === "fixed" ? t("discountTypeFixed") : t("discountTypePercentage")}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("discountValueLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setDiscountValue(event.target.value)}
              placeholder={discountType === "percentage" ? "10" : "10.00"}
              value={discountValue}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("taxRateLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setTaxRate(event.target.value)}
              placeholder="15.00"
              value={taxRate}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("notesLabel")}</span>
            <textarea
              className="min-h-28 rounded-[1.5rem] border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
          </label>
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{t("itemsSection")}</h2>
            <p className="mt-2 text-sm text-muted">{t("itemsDescription")}</p>
          </div>

          <button
            className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            onClick={() => setItems((current) => [...current, emptyItem()])}
            type="button"
          >
            {t("addItemButton")}
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {items.map((item, index) => {
            const selectedProduct =
              loadedProducts[item.product_id] ??
              products.find((product) => product.id === item.product_id) ??
              null;
            const enabledPricing = (selectedProduct?.pricing ?? []).filter((pricing) => pricing.is_enabled);

            return (
              <article
                key={`${item.product_id || "item"}-${index}`}
                className="rounded-[1.5rem] border border-line bg-white/80 p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">
                    {t("itemCardTitle", { number: index + 1 })}
                  </p>
                  {items.length > 1 ? (
                    <button
                      className="text-sm font-medium text-red-700"
                      onClick={() =>
                        setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                      }
                      type="button"
                    >
                      {t("removeItemButton")}
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                    <span>{t("productLabel")}</span>
                    <select
                      className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => void handleProductChange(index, event.target.value)}
                      value={item.product_id}
                    >
                      <option value="">{t("selectProductPlaceholder")}</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("quantityLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                      min={1}
                      onChange={(event) => updateItem(index, { quantity: Number(event.target.value) || 1 })}
                      type="number"
                      value={item.quantity}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-3">
                    <span>{t("billingCycleLabel")}</span>
                    <select
                      className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) =>
                        updateItem(index, {
                          billing_cycle: event.target.value as BillingCycle,
                        })
                      }
                      value={item.billing_cycle}
                    >
                      <option value="">{t("selectBillingCyclePlaceholder")}</option>
                      {enabledPricing.map((pricing) => (
                        <option key={pricing.billing_cycle} value={pricing.billing_cycle}>
                          {t(`billingCycle.${pricing.billing_cycle}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedProduct?.configurable_options && selectedProduct.configurable_options.length > 0 ? (
                  <div className="mt-6 grid gap-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("configurableOptionsSection")}
                    </h3>

                    {selectedProduct.configurable_options.map((option) => {
                      const currentSelection = item.configurable_options.find(
                        (selection) => selection.configurable_option_id === option.id,
                      );

                      if (!option.id) {
                        return null;
                      }

                      if (option.option_type === "select" || option.option_type === "radio") {
                        return (
                          <label key={option.id} className="grid gap-2 text-sm font-medium text-foreground">
                            <span>{option.name}</span>
                            <select
                              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                              onChange={(event) => updateSelection(index, option.id as string, event.target.value)}
                              value={String(currentSelection?.selected_value ?? "")}
                            >
                              {option.choices.map((choice) => (
                                <option key={choice.value} value={choice.value}>
                                  {choice.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        );
                      }

                      if (option.option_type === "quantity") {
                        return (
                          <label key={option.id} className="grid gap-2 text-sm font-medium text-foreground">
                            <span>{option.name}</span>
                            <input
                              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                              min={0}
                              onChange={(event) =>
                                updateSelection(index, option.id as string, Number(event.target.value) || 0)
                              }
                              type="number"
                              value={Number(currentSelection?.selected_value ?? 0)}
                            />
                          </label>
                        );
                      }

                      return (
                        <label key={option.id} className="grid gap-2 text-sm font-medium text-foreground">
                          <span>{option.name}</span>
                          <select
                            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                            onChange={(event) =>
                              updateSelection(index, option.id as string, event.target.value === "true")
                            }
                            value={String(Boolean(currentSelection?.selected_value ?? false))}
                          >
                            <option value="false">{t("noOption")}</option>
                            <option value="true">{t("yesOption")}</option>
                          </select>
                        </label>
                      );
                    })}
                  </div>
                ) : item.product_id ? (
                  <p className="mt-6 text-sm text-muted">{t("noConfigurableOptions")}</p>
                ) : null}
              </article>
            );
          })}
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
          onClick={reviewCheckout}
          type="button"
        >
          {t("reviewButton")}
        </button>

        <button
          className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={saveDraft}
          type="button"
        >
          {isPending ? t("saving") : t("saveDraftButton")}
        </button>

        <Link
          className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(locale, "/dashboard/orders")}
        >
          {t("cancelButton")}
        </Link>
      </div>
    </div>
  );
}
