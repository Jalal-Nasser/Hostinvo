"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ensureCsrfCookie, readCookie } from "@/components/provisioning/http";

type ProvisioningJobRetryButtonProps = {
  jobId: string;
  buttonLabel: string;
  runningLabel: string;
  successLabel: string;
  errorLabel: string;
};

export function ProvisioningJobRetryButton({
  jobId,
  buttonLabel,
  runningLabel,
  successLabel,
  errorLabel,
}: ProvisioningJobRetryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRetry() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/provisioning-jobs/${jobId}/retry`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify({}),
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;
          const firstError = payload?.errors
            ? Object.values(payload.errors)[0]?.[0]
            : payload?.message;

          setError(firstError ?? errorLabel);
          return;
        }

        setMessage(successLabel);
        router.refresh();
      } catch {
        setError(errorLabel);
      }
    });
  }

  return (
    <div className="grid gap-3">
      <button
        className="rounded-full border border-line bg-[#faf9f5]/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={handleRetry}
        type="button"
      >
        {isPending ? runningLabel : buttonLabel}
      </button>

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
    </div>
  );
}
