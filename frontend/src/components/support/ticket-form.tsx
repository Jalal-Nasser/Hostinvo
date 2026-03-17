"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import { type ClientRecord } from "@/lib/clients";
import {
  ticketPriorities,
  type TicketDepartmentRecord,
  type TicketFormPayload,
  type TicketPriority,
  type TicketRecord,
  type TicketServiceRecord,
} from "@/lib/support";

type TicketFormMode = "admin" | "client";

type TicketFormProps = {
  mode?: TicketFormMode;
  clients?: ClientRecord[];
  departments: TicketDepartmentRecord[];
  services?: TicketServiceRecord[];
  ticketsPath: string;
  serviceLabel: string;
  noServiceOptionLabel: string;
  initialServiceId?: string;
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

export function TicketForm({
  mode = "admin",
  clients = [],
  departments,
  services = [],
  ticketsPath,
  serviceLabel,
  noServiceOptionLabel,
  initialServiceId = "",
}: TicketFormProps) {
  const t = useTranslations("Support");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clientId, setClientId] = useState(mode === "admin" ? clients[0]?.id ?? "" : "");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const priorityLabels: Record<TicketPriority, string> = {
    low: t("priorityLow"),
    medium: t("priorityMedium"),
    high: t("priorityHigh"),
    urgent: t("priorityUrgent"),
  };

  function buildPayload(): TicketFormPayload {
    const payload: TicketFormPayload = {
      department_id: departmentId || null,
      service_id: serviceId || null,
      subject: subject.trim(),
      priority,
      message: message.trim(),
    };

    if (mode === "admin") {
      payload.client_id = clientId;
    }

    return payload;
  }

  function handleSubmit() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const endpointMode = mode === "client" ? "client" : "admin";
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/${endpointMode}/tickets`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
          },
          body: JSON.stringify(buildPayload()),
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("saveError"));
          return;
        }

        const payload = (await response.json()) as { data: TicketRecord };

        setSuccess(t("createSuccess"));
        router.replace(localePath(locale, `${ticketsPath}/${payload.data.id}`));
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
          {mode === "admin" ? (
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
          ) : null}

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("departmentLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setDepartmentId(event.target.value)}
              value={departmentId}
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{serviceLabel}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setServiceId(event.target.value)}
              value={serviceId}
            >
              <option value="">{noServiceOptionLabel}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.domain ?? service.reference_number}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("priorityLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setPriority(event.target.value as TicketPriority)}
              value={priority}
            >
              {ticketPriorities.map((value) => (
                <option key={value} value={value}>
                  {priorityLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("subjectLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setSubject(event.target.value)}
              placeholder={t("subjectPlaceholder")}
              value={subject}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("messageLabel")}</span>
            <textarea
              className="min-h-40 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("messagePlaceholder")}
              value={message}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={handleSubmit}
            type="button"
          >
            {isPending ? t("creating") : t("createTicketButton")}
          </button>

          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(locale, ticketsPath)}
          >
            {t("cancelButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}
