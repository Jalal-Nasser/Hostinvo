"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin } from "@/lib/auth";
import {
  domainRenewalStatuses,
  type DomainRenewalRecord,
  type DomainRenewalStatus,
} from "@/lib/domains";

type DomainRenewalFormProps = {
  domainId: string;
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

  const firstField = Object.values(payload.errors)[0];

  return firstField?.[0] ?? null;
}

export function DomainRenewalForm({ domainId }: DomainRenewalFormProps) {
  const t = useTranslations("Domains");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState("1");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<DomainRenewalStatus>("pending");
  const [renewedAt, setRenewedAt] = useState("");

  const statusLabels: Record<DomainRenewalStatus, string> = {
    pending: t("renewalStatusPending"),
    completed: t("renewalStatusCompleted"),
    failed: t("renewalStatusFailed"),
  };

  function handleSubmit() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/domains/${domainId}/renewals`,
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
              years: Number.parseInt(years, 10),
              price: Number.parseInt(price, 10),
              status,
              renewed_at: renewedAt || null,
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

        const payload = (await response.json()) as { data: DomainRenewalRecord };

        setMessage(t("renewalCreateSuccess", { years: payload.data.years }));
        setYears("1");
        setPrice("");
        setStatus("pending");
        setRenewedAt("");
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <div className="grid gap-4 rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("renewalYearsLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
            min={1}
            onChange={(event) => setYears(event.target.value)}
            type="number"
            value={years}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("renewalPriceLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
            min={0}
            onChange={(event) => setPrice(event.target.value)}
            type="number"
            value={price}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("renewalStatusLabel")}</span>
          <select
            className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
            onChange={(event) => setStatus(event.target.value as DomainRenewalStatus)}
            value={status}
          >
            {domainRenewalStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("renewedAtLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
            onChange={(event) => setRenewedAt(event.target.value)}
            type="date"
            value={renewedAt}
          />
        </label>
      </div>

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
          {isPending ? t("saving") : t("addRenewalButton")}
        </button>
      </div>
    </div>
  );
}
