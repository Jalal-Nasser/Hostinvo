"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import {
  domainStatuses,
  type DomainFormPayload,
  type DomainRecord,
  type DomainStatus,
} from "@/lib/domains";
import { type ClientRecord } from "@/lib/clients";
import { type ServiceRecord } from "@/lib/provisioning";

type DomainFormProps = {
  mode: "create" | "edit";
  clients: ClientRecord[];
  services: ServiceRecord[];
  initialDomain?: DomainRecord;
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

export function DomainForm({
  mode,
  clients,
  services,
  initialDomain,
}: DomainFormProps) {
  const t = useTranslations("Domains");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(initialDomain?.client_id ?? clients[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(initialDomain?.service_id ?? "");
  const [domain, setDomain] = useState(initialDomain?.domain ?? "");
  const [tld, setTld] = useState(initialDomain?.tld ?? "");
  const [status, setStatus] = useState<DomainStatus>(initialDomain?.status ?? "active");
  const [registrar, setRegistrar] = useState(initialDomain?.registrar ?? "");
  const [registrationDate, setRegistrationDate] = useState(initialDomain?.registration_date ?? "");
  const [expiryDate, setExpiryDate] = useState(initialDomain?.expiry_date ?? "");
  const [autoRenew, setAutoRenew] = useState(initialDomain?.auto_renew ?? true);
  const [dnsManagement, setDnsManagement] = useState(initialDomain?.dns_management ?? false);
  const [idProtection, setIdProtection] = useState(initialDomain?.id_protection ?? false);
  const [renewalPrice, setRenewalPrice] = useState(
    initialDomain?.renewal_price?.toString() ?? "",
  );
  const [currency, setCurrency] = useState(initialDomain?.currency ?? "USD");
  const [notes, setNotes] = useState(initialDomain?.notes ?? "");

  const statusLabels: Record<DomainStatus, string> = {
    active: t("statusActive"),
    expired: t("statusExpired"),
    pending_transfer: t("statusPendingTransfer"),
    pending_delete: t("statusPendingDelete"),
    cancelled: t("statusCancelled"),
  };

  function normalizePayload(): DomainFormPayload {
    return {
      client_id: clientId,
      service_id: nullable(serviceId),
      domain: domain.trim().toLowerCase(),
      tld: tld.trim().replace(/^\./, "").toLowerCase(),
      status,
      registrar: nullable(registrar),
      registration_date: nullable(registrationDate),
      expiry_date: expiryDate,
      auto_renew: autoRenew,
      dns_management: dnsManagement,
      id_protection: idProtection,
      renewal_price: renewalPrice.trim() === "" ? null : Number.parseInt(renewalPrice, 10),
      currency: currency.trim().toUpperCase(),
      notes: nullable(notes),
    };
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
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/domains`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/domains/${initialDomain?.id}`,
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
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("saveError"));
          return;
        }

        const payload = (await response.json()) as { data: DomainRecord };

        setMessage(mode === "create" ? t("createSuccess") : t("updateSuccess"));
        router.replace(localePath(locale, `/dashboard/domains/${payload.data.id}`));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  const cancelHref =
    mode === "create"
      ? localePath(locale, "/dashboard/domains")
      : localePath(locale, `/dashboard/domains/${initialDomain?.id}`);

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("clientLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setClientId(event.target.value)}
              value={clientId}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.display_name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("serviceLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setServiceId(event.target.value)}
              value={serviceId}
            >
              <option value="">{t("noServiceOption")}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.reference_number}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("domainLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setDomain(event.target.value)}
              required
              value={domain}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("tldLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setTld(event.target.value)}
              required
              value={tld}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setStatus(event.target.value as DomainStatus)}
              value={status}
            >
              {domainStatuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("registrarLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setRegistrar(event.target.value)}
              value={registrar}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("registrationDateLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setRegistrationDate(event.target.value)}
              type="date"
              value={registrationDate}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("expiryDateLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setExpiryDate(event.target.value)}
              required
              type="date"
              value={expiryDate}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("renewalPriceLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              min={0}
              onChange={(event) => setRenewalPrice(event.target.value)}
              type="number"
              value={renewalPrice}
            />
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

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("notesLabel")}</span>
            <textarea
              className="min-h-28 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-3 rounded-[1.5rem] border border-line bg-[#faf9f5]/80 px-4 py-4 text-sm font-medium text-foreground">
            <input checked={autoRenew} onChange={(event) => setAutoRenew(event.target.checked)} type="checkbox" />
            <span>{t("autoRenewLabel")}</span>
          </label>
          <label className="flex items-center gap-3 rounded-[1.5rem] border border-line bg-[#faf9f5]/80 px-4 py-4 text-sm font-medium text-foreground">
            <input
              checked={dnsManagement}
              onChange={(event) => setDnsManagement(event.target.checked)}
              type="checkbox"
            />
            <span>{t("dnsManagementLabel")}</span>
          </label>
          <label className="flex items-center gap-3 rounded-[1.5rem] border border-line bg-[#faf9f5]/80 px-4 py-4 text-sm font-medium text-foreground">
            <input
              checked={idProtection}
              onChange={(event) => setIdProtection(event.target.checked)}
              type="checkbox"
            />
            <span>{t("idProtectionLabel")}</span>
          </label>
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
          {isPending
            ? mode === "create"
              ? t("creating")
              : t("saving")
            : mode === "create"
              ? t("createButton")
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
