"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin } from "@/lib/auth";
import { decimalToMinor, minorToDecimalString, type InvoiceRecord } from "@/lib/billing";

type ManualInvoicePaymentFormProps = {
  invoice: InvoiceRecord;
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

  return Object.values(payload.errors)[0]?.[0] ?? null;
}

export function ManualInvoicePaymentForm({ invoice }: ManualInvoicePaymentFormProps) {
  const t = useTranslations("Billing");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(minorToDecimalString(invoice.balance_due_minor));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/invoices/${invoice.id}/payments`,
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
              payment_method: "manual",
              amount_minor: decimalToMinor(amount),
              reference: reference.trim() || null,
              notes: notes.trim() || null,
            }),
          },
        );

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("manualPaymentError"));
          return;
        }

        setMessage(t("manualPaymentSuccess"));
        router.refresh();
      } catch {
        setError(t("manualPaymentError"));
      }
    });
  }

  if (invoice.balance_due_minor < 1 || ["paid", "cancelled", "refunded"].includes(invoice.status)) {
    return null;
  }

  return (
    <section className="glass-card p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-foreground">{t("manualPaymentTitle")}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("amountLabel")}</span>
          <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setAmount(event.target.value)} value={amount} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("paymentReferenceLabel")}</span>
          <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setReference(event.target.value)} value={reference} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("notesLabel")}</span>
          <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setNotes(event.target.value)} value={notes} />
        </label>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button className="mt-5 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} onClick={submit} type="button">
        {isPending ? t("recordingPayment") : t("recordManualPaymentButton")}
      </button>
    </section>
  );
}
