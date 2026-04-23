"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { backendOrigin, localePath } from "@/lib/auth";
import {
  type GatewayCheckoutRecord,
  type GatewayCode,
  type GatewayOptionRecord,
  type InvoiceApiMode,
  type InvoiceRecord,
  formatMinorCurrency,
} from "@/lib/billing";

type PayPalApproveData = {
  orderID: string;
  payerID?: string;
};

type PayPalFieldInstance = {
  render: (selector: string) => Promise<void>;
};

type PayPalCardFieldsInstance = {
  isEligible?: () => boolean;
  submit: () => Promise<void>;
  NameField?: () => PayPalFieldInstance;
  NumberField?: () => PayPalFieldInstance;
  CVVField?: () => PayPalFieldInstance;
  ExpiryField?: () => PayPalFieldInstance;
};

type PayPalButtonsInstance = {
  isEligible?: () => boolean;
  render: (selector: string) => Promise<void>;
};

type PayPalNamespace = {
  Buttons: (options: {
    createOrder: () => Promise<string>;
    onApprove: (data: PayPalApproveData) => Promise<void>;
    onCancel: () => void;
    onError: (error: unknown) => void;
    style?: Record<string, unknown>;
  }) => PayPalButtonsInstance;
  CardFields?: (options: {
    createOrder: () => Promise<string>;
    onApprove: (data: PayPalApproveData) => Promise<void>;
    onError: (error: unknown) => void;
    style?: Record<string, Record<string, string | number>>;
  }) => PayPalCardFieldsInstance;
};

type PayPalWindow = Window & {
  paypal?: PayPalNamespace;
  __hostinvoPayPalSdkKey?: string;
  __hostinvoPayPalSdkPromise?: Promise<void>;
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

async function ensurePayPalSdk(checkout: NonNullable<GatewayOptionRecord["checkout"]>) {
  const sdkWindow = window as PayPalWindow;
  const sdkKey = [
    checkout.client_id ?? "",
    checkout.currency,
    checkout.intent,
    checkout.components.join(","),
  ].join("|");

  if (sdkWindow.paypal && sdkWindow.__hostinvoPayPalSdkKey === sdkKey) {
    return;
  }

  if (sdkWindow.__hostinvoPayPalSdkPromise && sdkWindow.__hostinvoPayPalSdkKey === sdkKey) {
    return sdkWindow.__hostinvoPayPalSdkPromise;
  }

  const existing = document.getElementById("hostinvo-paypal-sdk");
  if (existing) {
    existing.remove();
  }

  sdkWindow.__hostinvoPayPalSdkKey = sdkKey;
  sdkWindow.__hostinvoPayPalSdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": checkout.client_id ?? "",
      components: checkout.components.join(","),
      currency: checkout.currency,
      intent: checkout.intent,
      commit: "true",
    });

    script.id = "hostinvo-paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("PayPal SDK failed to load."));

    document.head.appendChild(script);
  });

  return sdkWindow.__hostinvoPayPalSdkPromise;
}

type InvoicePaymentFlowProps = {
  invoice: InvoiceRecord;
  gateways: GatewayOptionRecord[];
  mode?: InvoiceApiMode;
};

export function InvoicePaymentFlow({
  invoice,
  gateways,
  mode = "admin",
}: InvoicePaymentFlowProps) {
  const t = useTranslations("Billing");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeGateway, setActiveGateway] = useState<GatewayCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [paypalSdkReady, setPaypalSdkReady] = useState(false);
  const [paypalCardEligible, setPaypalCardEligible] = useState(false);
  const [paypalSdkError, setPaypalSdkError] = useState<string | null>(null);
  const paypalCaptureTriggered = useRef(false);
  const paypalRendered = useRef(false);
  const paypalCardFields = useRef<PayPalCardFieldsInstance | null>(null);
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null);
  const paypalCardNameRef = useRef<HTMLDivElement | null>(null);
  const paypalCardNumberRef = useRef<HTMLDivElement | null>(null);
  const paypalCardExpiryRef = useRef<HTMLDivElement | null>(null);
  const paypalCardCvvRef = useRef<HTMLDivElement | null>(null);

  const gatewayFromQuery = searchParams.get("gateway");
  const paymentStatus = searchParams.get("status");
  const paypalToken = searchParams.get("token");
  const paypalPayerId = searchParams.get("PayerID");
  const apiBase = `${process.env.NEXT_PUBLIC_API_BASE_URL}/${mode}`;
  const detailPath =
    mode === "client"
      ? localePath(locale, `/portal/invoices/${invoice.id}`)
      : localePath(locale, `/dashboard/invoices/${invoice.id}`);
  const copy =
    locale === "ar"
      ? {
          cardholderName: "اسم حامل البطاقة",
          cardNumber: "رقم البطاقة",
          cardExpiry: "تاريخ الانتهاء",
          cardSecurityCode: "رمز الأمان",
          payByCard: "ادفع بالبطاقة",
          processingCardPayment: "جارٍ معالجة دفع البطاقة...",
        }
      : {
          cardholderName: "Cardholder name",
          cardNumber: "Card number",
          cardExpiry: "Expiry date",
          cardSecurityCode: "Security code",
          payByCard: "Pay by card",
          processingCardPayment: "Processing card payment...",
        };

  const buildRedirectUrls = useCallback((gateway: GatewayCode) => {
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
  }, []);

  const createGatewayCheckout = useCallback(async (gateway: GatewayCode): Promise<GatewayCheckoutRecord> => {
    await ensureCsrfCookie();

    const xsrfToken = readCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBase}/invoices/${invoice.id}/gateway-checkouts`, {
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
    });

    const payload = (await response.json().catch(() => null)) as
      | { data?: GatewayCheckoutRecord; message?: string; errors?: Record<string, string[]> }
      | null;

    if (!response.ok || !payload?.data) {
      const firstError = payload?.errors
        ? Object.values(payload.errors)[0]?.[0]
        : payload?.message;

      throw new Error(firstError ?? t("paymentStartError"));
    }

    return payload.data;
  }, [apiBase, buildRedirectUrls, invoice.id, t]);

  const capturePayPalOrder = useCallback(async (orderId: string, payerId?: string) => {
    try {
      await ensureCsrfCookie();

      const xsrfToken = readCookie("XSRF-TOKEN");
      const response = await fetch(`${apiBase}/invoices/${invoice.id}/gateway-checkouts/paypal/capture`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
        },
        body: JSON.stringify({
          order_id: orderId,
          payer_id: payerId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string; errors?: Record<string, string[]> }
          | null;
        const firstError = payload?.errors
          ? Object.values(payload.errors)[0]?.[0]
          : payload?.message;

        return { ok: false as const, error: firstError ?? t("paymentStartError") };
      }

      return { ok: true as const };
    } catch {
      return { ok: false as const, error: t("paymentStartError") };
    }
  }, [apiBase, invoice.id, t]);

  const paypalGateway = useMemo(
    () =>
      gateways.find(
        (gateway) => gateway.code === "paypal" && gateway.checkout?.kind === "paypal_js_sdk",
      ) ?? null,
    [gateways],
  );
  const redirectGateways = useMemo(
    () => gateways.filter((gateway) => gateway !== paypalGateway),
    [gateways, paypalGateway],
  );

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

        const result = await capturePayPalOrder(paypalToken, paypalPayerId ?? undefined);

        if (!result.ok) {
          setError(result.error ?? t("paymentStartError"));
          setStatusMessage(null);
          paypalCaptureTriggered.current = false;
          return;
        }

        setStatusMessage(t("paymentCompletedMessage"));
        router.replace(detailPath);
        router.refresh();
      })();
    });
  }, [capturePayPalOrder, detailPath, gatewayFromQuery, invoice.status, paypalPayerId, paypalToken, router, t]);

  useEffect(() => {
    if (
      !paypalGateway?.checkout ||
      !paypalGateway.checkout.client_id ||
      invoice.balance_due_minor < 1 ||
      invoice.status === "paid"
    ) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await ensurePayPalSdk(paypalGateway.checkout!);

        if (cancelled) {
          return;
        }

        setPaypalSdkReady(true);
        setPaypalSdkError(null);
      } catch {
        if (!cancelled) {
          setPaypalSdkReady(false);
          setPaypalSdkError(t("paymentStartError"));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [invoice.balance_due_minor, invoice.status, paypalGateway, t]);

  useEffect(() => {
    if (
      !paypalSdkReady ||
      !paypalGateway?.checkout ||
      !paypalButtonsRef.current ||
      paypalRendered.current
    ) {
      return;
    }

    const sdkWindow = window as PayPalWindow;
    const paypal = sdkWindow.paypal;

    if (!paypal) {
      setPaypalSdkError(t("paymentStartError"));
      return;
    }

    paypalRendered.current = true;
    paypalButtonsRef.current.innerHTML = "";
    if (paypalCardNameRef.current) {
      paypalCardNameRef.current.innerHTML = "";
    }
    if (paypalCardNumberRef.current) {
      paypalCardNumberRef.current.innerHTML = "";
    }
    if (paypalCardExpiryRef.current) {
      paypalCardExpiryRef.current.innerHTML = "";
    }
    if (paypalCardCvvRef.current) {
      paypalCardCvvRef.current.innerHTML = "";
    }

    const createPayPalOrder = async () => {
      const checkout = await createGatewayCheckout("paypal");
      return checkout.external_reference;
    };

    const handleApprove = async (data: PayPalApproveData) => {
      setError(null);
      setStatusMessage(t("paypalCapturingMessage"));

      const result = await capturePayPalOrder(data.orderID, data.payerID);

      if (!result.ok) {
        setError(result.error ?? t("paymentStartError"));
        setStatusMessage(null);
        throw new Error(result.error ?? t("paymentStartError"));
      }

      setStatusMessage(t("paymentCompletedMessage"));
      router.replace(detailPath);
      router.refresh();
    };

    const handlePayPalError = (reason: unknown) => {
      setStatusMessage(null);
      setError(reason instanceof Error ? reason.message : t("paymentStartError"));
    };

    void paypal
      .Buttons({
        createOrder: createPayPalOrder,
        onApprove: handleApprove,
        onCancel: () => {
          setStatusMessage(t("paymentCancelledMessage"));
        },
        onError: handlePayPalError,
        style: {
          layout: "vertical",
          label: "pay",
          shape: "rect",
        },
      })
      .render("#hostinvo-paypal-buttons");

    if (
      paypal.CardFields &&
      paypalCardNameRef.current &&
      paypalCardNumberRef.current &&
      paypalCardExpiryRef.current &&
      paypalCardCvvRef.current
    ) {
      const cardFields = paypal.CardFields({
        createOrder: createPayPalOrder,
        onApprove: handleApprove,
        onError: handlePayPalError,
        style: {
          input: {
            "font-size": "14px",
            color: "#0a1628",
          },
        },
      });

      const eligible = cardFields.isEligible?.() ?? false;
      setPaypalCardEligible(eligible);

      if (eligible) {
        paypalCardFields.current = cardFields;

        void Promise.all([
          cardFields.NameField?.().render("#hostinvo-paypal-card-name") ?? Promise.resolve(),
          cardFields.NumberField?.().render("#hostinvo-paypal-card-number") ?? Promise.resolve(),
          cardFields.ExpiryField?.().render("#hostinvo-paypal-card-expiry") ?? Promise.resolve(),
          cardFields.CVVField?.().render("#hostinvo-paypal-card-cvv") ?? Promise.resolve(),
        ]).catch(() => {
          setPaypalCardEligible(false);
        });
      }
    }
  }, [capturePayPalOrder, createGatewayCheckout, detailPath, paypalGateway, paypalSdkReady, router, t]);

  function startGatewayCheckout(gateway: GatewayCode) {
    setError(null);
    setStatusMessage(null);
    setActiveGateway(gateway);

    startTransition(() => {
      void (async () => {
        try {
          const checkout = await createGatewayCheckout(gateway);
          window.location.assign(checkout.redirect_url);
        } catch (gatewayError) {
          setError(
            gatewayError instanceof Error ? gatewayError.message : t("paymentStartError"),
          );
          setActiveGateway(null);
        }
      })();
    });
  }

  function submitPayPalCardFields() {
    setError(null);
    setStatusMessage(null);
    setActiveGateway("paypal");

    startTransition(() => {
      void paypalCardFields.current?.submit().catch(() => {
        setError(t("paymentStartError"));
        setActiveGateway(null);
      });
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
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("invoiceReferenceLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{invoice.reference_number}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("balanceDueLabel")}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatMinorCurrency(invoice.balance_due_minor, invoice.currency, locale)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("clientLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {invoice.client?.display_name ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
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
            {paypalGateway ? (
              <article className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{paypalGateway.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{paypalGateway.description}</p>
                  </div>
                  <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
                    {t("gatewayLabelPaypal")}
                  </span>
                </div>

                <div className="mt-5 grid gap-4">
                  <div
                    id="hostinvo-paypal-buttons"
                    ref={paypalButtonsRef}
                    className="grid gap-3"
                  />

                  {paypalCardEligible ? (
                    <div className="grid gap-3 rounded-2xl border border-line bg-white p-4">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            {copy.cardholderName}
                          </p>
                          <div
                            id="hostinvo-paypal-card-name"
                            ref={paypalCardNameRef}
                            className="min-h-[48px] rounded-2xl border border-line px-3 py-2"
                          />
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            {copy.cardNumber}
                          </p>
                          <div
                            id="hostinvo-paypal-card-number"
                            ref={paypalCardNumberRef}
                            className="min-h-[48px] rounded-2xl border border-line px-3 py-2"
                          />
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            {copy.cardExpiry}
                          </p>
                          <div
                            id="hostinvo-paypal-card-expiry"
                            ref={paypalCardExpiryRef}
                            className="min-h-[48px] rounded-2xl border border-line px-3 py-2"
                          />
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                            {copy.cardSecurityCode}
                          </p>
                          <div
                            id="hostinvo-paypal-card-cvv"
                            ref={paypalCardCvvRef}
                            className="min-h-[48px] rounded-2xl border border-line px-3 py-2"
                          />
                        </div>
                      </div>

                      <button
                        className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isPending || invoice.balance_due_minor < 1 || invoice.status === "paid"}
                        onClick={submitPayPalCardFields}
                        type="button"
                      >
                        {isPending && activeGateway === "paypal"
                          ? copy.processingCardPayment
                          : copy.payByCard}
                      </button>
                    </div>
                  ) : null}

                  {!paypalSdkReady || paypalSdkError ? (
                    <button
                      className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isPending || invoice.balance_due_minor < 1 || invoice.status === "paid"}
                      onClick={() => startGatewayCheckout("paypal")}
                      type="button"
                    >
                      {isPending && activeGateway === "paypal"
                        ? t("redirectingToGateway")
                        : t("payWithGatewayButton", { gateway: paypalGateway.label })}
                    </button>
                  ) : null}
                </div>
              </article>
            ) : null}

            {redirectGateways.length > 0 ? (
              redirectGateways.map((gateway) => (
                <article
                  key={gateway.code}
                  className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5"
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
            ) : paypalGateway ? null : (
              <p className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5 text-sm text-muted">
                {t("noGatewayOptions")}
              </p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
