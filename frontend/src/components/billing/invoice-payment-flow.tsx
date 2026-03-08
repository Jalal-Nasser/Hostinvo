"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { backendOrigin, localePath } from "@/lib/auth";
import {
  type GatewayCode,
  type GatewayOptionRecord,
  type GatewayCheckoutRecord,
  type InvoiceRecord,
  formatMinorCurrency,
} from "@/lib/billing";

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

type InvoicePaymentFlowProps = {
  invoice: InvoiceRecord;
  gateways: GatewayOptionRecord[];
};

export function InvoicePaymentFlow({ invoice, gateways }: InvoicePaymentFlowProps) {
  const t = useTranslations("Billing");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeGateway, setActiveGateway] = useState<GatewayCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const paypalCaptureTriggered = useRef(false);

  const gatewayFromQuery = searchParams.get("gateway");
  const paymentStatus = searchParams.get("status");
  const paypalToken = searchParams.get("token");
  const paypalPayerId = searchParams.get("PayerID");

  useEffect(() => {
    if (invoice.status === "paid") {
      setStatusMessage(t("paymentCompletedMessage"));
      return;
    }

    if (gatewayFromQuery === "stripe" && paymentStatus === "success") {
      setStatusMessage(t("stripePendingMessage"));
    } else if (gatewayFromQuery && paymentStatus === "cancelled") {
      setStatusMessage(t("paymentCancelledMessage"));
    }
  }, [gatewayFromQuery, invoice.status, paymentStatus, t]);

  useEffect(() => {
    if (
      gatewayFromQuery !== "paypal" ||
      !paypalToken ||
      invoice.status === "paid" ||
      paypalCaptureTriggered.current
    ) {
      return;
    }

    paypalCaptureTriggered.current = true;

    startTransition(() => {
      void (async () => {
        setError(null);
        setStatusMessage(t("paypalCapturingMessage"));

        try {
          await ensureCsrfCookie();

          const xsrfToken = readCookie("XSRF-TOKEN");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/invoices/${invoice.id}/gateway-checkouts/paypal/capture`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
              },
              body: JSON.stringify({
                order_id: paypalToken,
                payer_id: paypalPayerId,
              }),
            },
          );

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as
              | { message?: string; errors?: Record<string, string[]> }
              | null;
            const firstError = payload?.errors
              ? Object.values(payload.errors)[0]?.[0]
              : payload?.message;

            setError(firstError ?? t("paymentStartError"));
            setStatusMessage(null);
            paypalCaptureTriggered.current = false;
            return;
          }

          setStatusMessage(t("paymentCompletedMessage"));
          router.replace(localePath(locale, `/dashboard/invoices/${invoice.id}`));
          router.refresh();
        } catch {
          setError(t("paymentStartError"));
          setStatusMessage(null);
          paypalCaptureTriggered.current = false;
        }
      })();
    });
  }, [gatewayFromQuery, invoice.id, invoice.status, locale, paypalPayerId, paypalToken, router, t]);

  function buildRedirectUrls(gateway: GatewayCode) {
    const baseUrl = new URL(window.location.href);
    baseUrl.search = "";
    baseUrl.hash = "";

    const successUrl = new URL(baseUrl.toString());
    const cancelUrl = new URL(baseUrl.toString());

    successUrl.searchParams.set("gateway", gateway);

    if (gateway === "stripe") {
      successUrl.searchParams.set("status", "success");
    }

    if (gateway === "paypal") {
      successUrl.searchParams.set("status", "approved");
    }

    cancelUrl.searchParams.set("gateway", gateway);
    cancelUrl.searchParams.set("status", "cancelled");

    return {
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
    };
  }

  function startGatewayCheckout(gateway: GatewayCode) {
    setError(null);
    setStatusMessage(null);
    setActiveGateway(gateway);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/invoices/${invoice.id}/gateway-checkouts`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify({
              gateway,
              ...buildRedirectUrls(gateway),
            }),
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;
          const firstError = payload?.errors
            ? Object.values(payload.errors)[0]?.[0]
            : payload?.message;

          setError(firstError ?? t("paymentStartError"));
          setActiveGateway(null);
          return;
        }

        const payload = (await response.json()) as { data: GatewayCheckoutRecord };
        window.location.assign(payload.data.redirect_url);
      } catch {
        setError(t("paymentStartError"));
        setActiveGateway(null);
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("payInvoiceTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            {t("payInvoiceDescription")}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("invoiceReferenceLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{invoice.reference_number}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("balanceDueLabel")}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatMinorCurrency(invoice.balance_due_minor, invoice.currency, locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("clientLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {invoice.client?.display_name ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statusLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t(`status${invoice.status.charAt(0).toUpperCase()}${invoice.status.slice(1)}`)}
              </p>
            </div>
          </div>

          {statusMessage ? (
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {statusMessage}
            </p>
          ) : null}

          {error ? (
            <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </article>

        <aside className="glass-card p-6 md:p-8">
          <h3 className="text-xl font-semibold text-foreground">{t("availableGatewaysTitle")}</h3>
          <div className="mt-5 grid gap-4">
            {gateways.length > 0 ? (
              gateways.map((gateway) => (
                <article
                  key={gateway.code}
                  className="rounded-[1.5rem] border border-line bg-white/80 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{gateway.label}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{gateway.description}</p>
                    </div>
                    <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
                      {t(`gatewayLabel${gateway.code.charAt(0).toUpperCase()}${gateway.code.slice(1)}`)}
                    </span>
                  </div>

                  <button
                    className="mt-5 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isPending || invoice.balance_due_minor < 1 || invoice.status === "paid"}
                    onClick={() => startGatewayCheckout(gateway.code)}
                    type="button"
                  >
                    {isPending && activeGateway === gateway.code
                      ? t("redirectingToGateway")
                      : t("payWithGatewayButton", { gateway: gateway.label })}
                  </button>
                </article>
              ))
            ) : (
              <p className="rounded-[1.5rem] border border-line bg-white/80 p-5 text-sm text-muted">
                {t("noGatewayOptions")}
              </p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
