"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin } from "@/lib/auth";
import { type TicketRecord, type TicketStatusRecord } from "@/lib/support";

type TicketReplyFormProps = {
  ticket: TicketRecord;
  statuses: TicketStatusRecord[];
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

export function TicketReplyForm({ ticket, statuses }: TicketReplyFormProps) {
  const t = useTranslations("Support");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [statusId, setStatusId] = useState(ticket.status_id);
  const [isInternal, setIsInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/tickets/${ticket.id}/replies`,
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
              message: message.trim(),
              status_id: statusId || null,
              is_internal: isInternal,
            }),
          },
        );

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("replyError"));
          return;
        }

        setMessage("");
        setIsInternal(false);
        setSuccess(t("replySuccess"));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <section className="glass-card p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-foreground">{t("replySectionTitle")}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("replySectionDescription")}</p>

      <div className="mt-6 grid gap-6">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("messageLabel")}</span>
          <textarea
            className="min-h-40 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t("replyPlaceholder")}
            value={message}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setStatusId(event.target.value)}
              value={statusId}
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-3 rounded-2xl border border-line bg-[#faf9f5]/80 px-4 py-3 text-sm font-medium text-foreground">
            <input
              checked={isInternal}
              className="size-4"
              onChange={(event) => setIsInternal(event.target.checked)}
              type="checkbox"
            />
            <span>{t("internalNoteLabel")}</span>
          </label>
        </div>
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
          {isPending ? t("replying") : t("replyButton")}
        </button>
      </div>
    </section>
  );
}
