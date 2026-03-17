"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import {
  formatMinorCurrency,
  orderDraftStorageKey,
  type OrderFormPayload,
  type OrderPreviewRecord,
} from "@/lib/orders";

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

export function OrderReview() {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<OrderFormPayload | null>(null);
  const [preview, setPreview] = useState<OrderPreviewRecord | null>(null);

  useEffect(() => {
    const rawDraft = sessionStorage.getItem(orderDraftStorageKey);

    if (!rawDraft) {
      setError(t("reviewMissingDraft"));
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft) as OrderFormPayload;
      setDraft(parsed);

      void (async () => {
        try {
          await ensureCsrfCookie();

          const xsrfToken = readCookie("XSRF-TOKEN");
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders/review`, {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify(parsed),
          });

          if (!response.ok) {
            const errorPayload = (await response.json().catch(() => null)) as
              | { message?: string; errors?: Record<string, string[]> }
              | null;

            setError(firstErrorFromPayload(errorPayload) ?? t("reviewError"));
            setIsLoading(false);
            return;
          }

          const payload = (await response.json()) as { data: OrderPreviewRecord };
          setPreview(payload.data);
          setIsLoading(false);
        } catch {
          setError(t("serviceUnavailable"));
          setIsLoading(false);
        }
      })();
    } catch {
      setError(t("reviewError"));
      setIsLoading(false);
    }
  }, [t]);

  function submit(endpoint: "draft" | "place") {
    if (!draft) {
      setError(t("reviewMissingDraft"));
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          endpoint === "place"
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders/place`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify(draft),
          },
        );

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

  if (isLoading) {
    return (
      <section className="glass-card p-8">
        <p className="text-sm text-muted">{t("reviewLoading")}</p>
      </section>
    );
  }

  if (!preview) {
    return (
      <section className="glass-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("reviewUnavailableTitle")}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{error ?? t("reviewError")}</p>
        <div className="mt-6">
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(locale, "/dashboard/orders/new")}
          >
            {t("backToCreateButton")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("reviewItemsTitle")}</h2>
          <div className="mt-6 grid gap-4">
            {preview.items.map((item, index) => (
              <div
                key={`${item.product_id}-${index}`}
                className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{item.product_name}</p>
                    <p className="mt-2 text-sm text-muted">
                      {t(`billingCycle.${item.billing_cycle}`)} / {t("quantityValue", { value: item.quantity })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatMinorCurrency(item.total_minor, preview.currency, locale)}
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
              </div>
            ))}
          </div>
        </article>

        <aside className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("summaryTitle")}</h2>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("clientLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{preview.client.display_name}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("subtotalLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(preview.subtotal_minor, preview.currency, locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("discountLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(preview.discount_amount_minor, preview.currency, locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("taxLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatMinorCurrency(preview.tax_amount_minor, preview.currency, locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#fffdf8] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("totalLabel")}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatMinorCurrency(preview.total_minor, preview.currency, locale)}
              </p>
            </div>
          </div>
        </aside>
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
          onClick={() => submit("place")}
          type="button"
        >
          {isPending ? t("placing") : t("placeOrderButton")}
        </button>

        <button
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() => submit("draft")}
          type="button"
        >
          {t("saveDraftButton")}
        </button>

        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(locale, "/dashboard/orders/new")}
        >
          {t("backToCreateButton")}
        </Link>
      </div>
    </div>
  );
}
