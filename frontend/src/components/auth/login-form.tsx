"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function LoginForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
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
              email: formData.get("email"),
              password: formData.get("password"),
              remember: formData.get("remember") === "on",
            }),
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(payload?.message ?? payload?.errors?.email?.[0] ?? t("loginError"));
          return;
        }

        router.replace(localePath(locale, "/dashboard"));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-foreground">
        <span>{t("emailLabel")}</span>
        <input
          className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
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

      <label className="flex items-center gap-3 text-sm text-muted">
        <input className="h-4 w-4 rounded border-line" name="remember" type="checkbox" />
        <span>{t("rememberLabel")}</span>
      </label>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? t("loggingIn") : t("loginButton")}
      </button>

      <Link
        href={localePath(locale, "/auth/forgot-password")}
        className="text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        {t("forgotPasswordLink")}
      </Link>
    </form>
  );
}
