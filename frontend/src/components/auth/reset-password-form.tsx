"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";

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

type ResetPasswordFormProps = {
  initialEmail?: string;
  token?: string;
};

export function ResetPasswordForm({
  initialEmail,
  token,
}: ResetPasswordFormProps) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(token);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    if (!hasToken) {
      setError(t("tokenMissing"));
      return;
    }

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/reset-password`,
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
              token,
              email: formData.get("email"),
              password: formData.get("password"),
              password_confirmation: formData.get("password_confirmation"),
            }),
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          const firstFieldError = payload?.errors
            ? Object.values(payload.errors)[0]?.[0]
            : null;

          setError(payload?.message ?? firstFieldError ?? t("resetPasswordError"));
          return;
        }

        const payload = (await response.json()) as { message?: string };
        setMessage(payload.message ?? t("resetPasswordSuccess"));
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-4">
      {!hasToken ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("tokenMissing")}
        </p>
      ) : null}

      <p className="text-sm leading-7 text-muted">{t("resetPasswordPlaceholder")}</p>

      <label className="grid gap-2 text-sm font-medium text-foreground">
        <span>{t("emailLabel")}</span>
        <input
          className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
          defaultValue={initialEmail}
          name="email"
          type="email"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-foreground">
        <span>{t("passwordLabel")}</span>
        <input
          className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
          name="password"
          type="password"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-foreground">
        <span>{t("passwordConfirmationLabel")}</span>
        <input
          className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
          name="password_confirmation"
          type="password"
          required
        />
      </label>

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

      <button
        className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending || !hasToken}
        type="submit"
      >
        {isPending ? t("resettingPassword") : t("resetPasswordButton")}
      </button>

      <Link
        href={localePath(locale, "/auth/login")}
        className="text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        {t("backToLogin")}
      </Link>
    </form>
  );
}
