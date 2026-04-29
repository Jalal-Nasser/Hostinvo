"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ensureCsrfCookie, readCookie } from "@/components/provisioning/http";
import { type ServerConnectionTestRecord } from "@/lib/provisioning";

type ServerConnectionTesterProps = {
  serverId: string;
  buttonLabel: string;
  runningLabel: string;
  successLabel: string;
  errorLabel: string;
  variant?: "default" | "server-widget";
};

export function ServerConnectionTester({
  serverId,
  buttonLabel,
  runningLabel,
  successLabel,
  errorLabel,
  variant = "default",
}: ServerConnectionTesterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ServerConnectionTestRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleTest() {
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/servers/${serverId}/test`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;
          const firstError = payload?.errors
            ? Object.values(payload.errors)[0]?.[0]
            : payload?.message;

          setError(firstError ?? errorLabel);
          setResult(null);
          return;
        }

        const payload = (await response.json()) as { data: ServerConnectionTestRecord };
        setResult(payload.data);
        router.refresh();
      } catch {
        setError(errorLabel);
        setResult(null);
      }
    });
  }

  const isServerWidget = variant === "server-widget";

  return (
    <div className={isServerWidget ? "grid gap-2" : "grid gap-3"}>
      <button
        className={
          isServerWidget
            ? "server-widget-action"
            : "rounded-full border border-line bg-[#faf9f5]/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60"
        }
        disabled={isPending}
        onClick={handleTest}
        type="button"
      >
        {isServerWidget ? (
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M7 17l-2 2m12-2l2 2M8.5 9.5l-3-3m10 3l3-3M12 6v3m-4 5a4 4 0 018 0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        ) : null}
        {isPending ? runningLabel : buttonLabel}
      </button>

      {result ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {result.version ? `${successLabel} (${result.version})` : successLabel}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
