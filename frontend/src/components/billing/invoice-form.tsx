"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import {
  bpsToPercentString,
  decimalToMinor,
  formatMinorCurrency,
  invoiceItemTypes,
  invoiceStatuses,
  minorToDecimalString,
  percentToBps,
  type InvoiceFormPayload,
  type InvoiceItemRecord,
  type InvoiceItemType,
  type InvoiceRecord,
} from "@/lib/billing";
import { type BillingCycle, billingCycles } from "@/lib/catalog";
import { type ClientRecord } from "@/lib/clients";
import { type OrderRecord } from "@/lib/orders";

type InvoiceFormProps = {
  mode: "create" | "edit";
  clients: ClientRecord[];
  orders: OrderRecord[];
  initialInvoice?: InvoiceRecord;
};

type InvoiceItemFormState = {
  id?: string;
  order_item_id?: string | null;
  item_type: InvoiceItemType;
  description: string;
  billing_cycle: BillingCycle | "";
  billing_period_starts_at: string;
  billing_period_ends_at: string;
  quantity: number;
  unit_price: string;
  metadata?: Record<string, unknown> | null;
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

function emptyItem(): InvoiceItemFormState {
  return {
    item_type: "manual",
    description: "",
    billing_cycle: "",
    billing_period_starts_at: "",
    billing_period_ends_at: "",
    quantity: 1,
    unit_price: "0.00",
    metadata: null,
  };
}

function itemFromInvoice(item: InvoiceItemRecord): InvoiceItemFormState {
  return {
    id: item.id,
    order_item_id: item.order_item_id,
    item_type: item.item_type,
    description: item.description,
    billing_cycle: item.billing_cycle ?? "",
    billing_period_starts_at: item.billing_period_starts_at ?? "",
    billing_period_ends_at: item.billing_period_ends_at ?? "",
    quantity: item.quantity,
    unit_price: minorToDecimalString(item.unit_price_minor),
    metadata: item.metadata ?? null,
  };
}

async function fetchOrderDetails(orderId: string): Promise<OrderRecord | null> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders/${orderId}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: OrderRecord };

  return payload.data;
}

function itemsFromOrder(order: OrderRecord): InvoiceItemFormState[] {
  return (order.items ?? []).map((item) => ({
    order_item_id: item.id,
    item_type: "order",
    description: `${item.product_name} (${item.billing_cycle})`,
    billing_cycle: item.billing_cycle,
    billing_period_starts_at: "",
    billing_period_ends_at: "",
    quantity: item.quantity,
    unit_price: minorToDecimalString(Math.floor(item.total_minor / Math.max(item.quantity, 1))),
    metadata: {
      product_snapshot: item.product_snapshot ?? null,
      configurable_options: item.configurable_options ?? [],
    },
  }));
}

export function InvoiceForm({
  mode,
  clients,
  orders,
  initialInvoice,
}: InvoiceFormProps) {
  const t = useTranslations("Billing");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(initialInvoice?.client_id ?? "");
  const [orderId, setOrderId] = useState(initialInvoice?.order_id ?? "");
  const [status, setStatus] = useState(initialInvoice?.status ?? "unpaid");
  const [currency, setCurrency] = useState(initialInvoice?.currency ?? "USD");
  const [issueDate, setIssueDate] = useState(
    initialInvoice?.issue_date ?? new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.due_date ?? new Date().toISOString().slice(0, 10),
  );
  const [recurringCycle, setRecurringCycle] = useState<BillingCycle | "">(
    initialInvoice?.recurring_cycle ?? "",
  );
  const [nextInvoiceDate, setNextInvoiceDate] = useState(initialInvoice?.next_invoice_date ?? "");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage" | "">(
    initialInvoice?.discount_type ?? "",
  );
  const [discountValue, setDiscountValue] = useState(
    initialInvoice?.discount_type === "fixed"
      ? minorToDecimalString(initialInvoice.discount_value)
      : initialInvoice?.discount_type === "percentage"
        ? bpsToPercentString(initialInvoice.discount_value)
        : "",
  );
  const [creditApplied, setCreditApplied] = useState(
    initialInvoice ? minorToDecimalString(initialInvoice.credit_applied_minor) : "0.00",
  );
  const [taxRate, setTaxRate] = useState(
    initialInvoice ? bpsToPercentString(initialInvoice.tax_rate_bps) : "0.00",
  );
  const [notes, setNotes] = useState(initialInvoice?.notes ?? "");
  const [items, setItems] = useState<InvoiceItemFormState[]>(
    initialInvoice?.items?.map(itemFromInvoice) ?? [emptyItem()],
  );

  const statusLabels = {
    draft: t("statusDraft"),
    unpaid: t("statusUnpaid"),
    paid: t("statusPaid"),
    overdue: t("statusOverdue"),
    cancelled: t("statusCancelled"),
    refunded: t("statusRefunded"),
  } as const;

  const itemTypeLabels: Record<InvoiceItemType, string> = {
    manual: t("itemTypeManual"),
    order: t("itemTypeOrder"),
    service: t("itemTypeService"),
  };

  async function handleOrderChange(nextOrderId: string) {
    setOrderId(nextOrderId);

    if (!nextOrderId) {
      return;
    }

    const order = await fetchOrderDetails(nextOrderId);

    if (!order) {
      setError(t("orderImportError"));
      return;
    }

    setClientId(order.client_id);
    setCurrency(order.currency);
    setItems(itemsFromOrder(order));
  }

  function updateItem(
    index: number,
    field: keyof InvoiceItemFormState,
    value: string | number | null,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function normalizePayload(): InvoiceFormPayload {
    return {
      client_id: clientId,
      order_id: nullable(orderId),
      currency: nullable(currency)?.toUpperCase() ?? "USD",
      issue_date: nullable(issueDate),
      due_date: nullable(dueDate),
      status,
      recurring_cycle: recurringCycle || null,
      next_invoice_date: nullable(nextInvoiceDate),
      discount_type: discountType || null,
      discount_value:
        discountType === "fixed"
          ? decimalToMinor(discountValue)
          : discountType === "percentage"
            ? percentToBps(discountValue)
            : null,
      credit_applied_minor: decimalToMinor(creditApplied),
      tax_rate_bps: percentToBps(taxRate),
      notes: nullable(notes),
      items: items
        .filter((item) => item.description.trim() !== "")
        .map((item) => ({
          id: item.id,
          order_item_id: item.order_item_id ?? null,
          item_type: item.item_type,
          description: item.description.trim(),
          related_type: item.order_item_id ? "order_item" : null,
          related_id: item.order_item_id ?? null,
          billing_cycle: item.billing_cycle || null,
          billing_period_starts_at: nullable(item.billing_period_starts_at),
          billing_period_ends_at: nullable(item.billing_period_ends_at),
          quantity: Math.max(1, item.quantity),
          unit_price_minor: decimalToMinor(item.unit_price),
          metadata: item.metadata ?? null,
        })),
    };
  }

  async function submitInvoice() {
    try {
      await ensureCsrfCookie();

      const xsrfToken = readCookie("XSRF-TOKEN");
      const response = await fetch(
        mode === "create"
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/invoices`
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/invoices/${initialInvoice?.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
          },
          body: JSON.stringify(normalizePayload()),
        },
      );

      if (!response.ok) {
        const errorPayload: { message?: string; errors?: Record<string, string[]> } | null =
          await response.json().catch(() => null);

        setError(firstErrorFromPayload(errorPayload) ?? t("saveError"));
        return;
      }

      const payload = (await response.json()) as { data: InvoiceRecord };
      router.replace(localePath(locale, `/dashboard/invoices/${payload.data.id}`));
      router.refresh();
    } catch {
      setError(t("serviceUnavailable"));
    }
  }

  function handleSubmit() {
    setError(null);

    startTransition(() => {
      void submitInvoice();
    });
  }

  const cancelHref =
    mode === "create"
      ? localePath(locale, "/dashboard/invoices")
      : localePath(locale, `/dashboard/invoices/${initialInvoice?.id}`);

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("clientLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => {
                const nextClientId = event.target.value;
                const client = clients.find((item) => item.id === nextClientId);
                setClientId(nextClientId);
                setCurrency(client?.currency ?? currency);
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
            <span>{t("orderLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => void handleOrderChange(event.target.value)}
              value={orderId}
            >
              <option value="">{t("selectOrderPlaceholder")}</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.reference_number}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setStatus(event.target.value as typeof status)}
              value={status}
            >
              {invoiceStatuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("currencyLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 uppercase outline-none transition focus:border-accent"
              maxLength={3}
              onChange={(event) => setCurrency(event.target.value)}
              value={currency}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("issueDateLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setIssueDate(event.target.value)}
              type="date"
              value={issueDate}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("dueDateLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              value={dueDate}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("recurringCycleLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setRecurringCycle(event.target.value as BillingCycle | "")}
              value={recurringCycle}
            >
              <option value="">{t("noRecurringOption")}</option>
              {billingCycles.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {t(`billingCycle.${cycle}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("nextInvoiceDateLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setNextInvoiceDate(event.target.value)}
              type="date"
              value={nextInvoiceDate}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("discountTypeLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setDiscountType(event.target.value as "fixed" | "percentage" | "")}
              value={discountType}
            >
              <option value="">{t("noDiscountOption")}</option>
              <option value="fixed">{t("discountTypeFixed")}</option>
              <option value="percentage">{t("discountTypePercentage")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("discountValueLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setDiscountValue(event.target.value)}
              placeholder={discountType === "percentage" ? "10" : "10.00"}
              value={discountValue}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("creditAppliedLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setCreditApplied(event.target.value)}
              value={creditApplied}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("taxRateLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setTaxRate(event.target.value)}
              value={taxRate}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("notesLabel")}</span>
            <textarea
              className="min-h-28 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
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
            className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            onClick={() => setItems((current) => [...current, emptyItem()])}
            type="button"
          >
            {t("addItemButton")}
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {items.map((item, index) => (
            <article
              key={item.id ?? item.order_item_id ?? `invoice-item-${index}`}
              className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t("itemCardTitle", { number: index + 1 })}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
                    {itemTypeLabels[item.item_type]}
                  </p>
                </div>
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

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                  <span>{t("descriptionLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateItem(index, "description", event.target.value)}
                    value={item.description}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("itemTypeLabel")}</span>
                  <select
                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) =>
                      updateItem(index, "item_type", event.target.value as InvoiceItemType)
                    }
                    value={item.item_type}
                  >
                    {invoiceItemTypes.map((value) => (
                      <option key={value} value={value}>
                        {itemTypeLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("billingCycleLabel")}</span>
                  <select
                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) =>
                      updateItem(index, "billing_cycle", event.target.value as BillingCycle | "")
                    }
                    value={item.billing_cycle}
                  >
                    <option value="">{t("noBillingCycleOption")}</option>
                    {billingCycles.map((cycle) => (
                      <option key={cycle} value={cycle}>
                        {t(`billingCycle.${cycle}`)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("quantityLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                    min={1}
                    onChange={(event) => updateItem(index, "quantity", Number(event.target.value) || 1)}
                    type="number"
                    value={item.quantity}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("unitPriceLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateItem(index, "unit_price", event.target.value)}
                    value={item.unit_price}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("periodStartLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateItem(index, "billing_period_starts_at", event.target.value)}
                    type="date"
                    value={item.billing_period_starts_at}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("periodEndLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateItem(index, "billing_period_ends_at", event.target.value)}
                    type="date"
                    value={item.billing_period_ends_at}
                  />
                </label>
              </div>

              <p className="mt-4 text-sm text-muted">
                {t("lineTotalLabel")}:{" "}
                {formatMinorCurrency(
                  decimalToMinor(item.unit_price) * Math.max(1, item.quantity),
                  currency,
                  locale,
                )}
              </p>
            </article>
          ))}
        </div>
      </section>

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
          {isPending
            ? mode === "create"
              ? t("creating")
              : t("saving")
            : mode === "create"
              ? t("createInvoiceButton")
              : t("saveButton")}
        </button>

        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={cancelHref}
        >
          {t("cancelButton")}
        </Link>
      </div>
    </div>
  );
}
