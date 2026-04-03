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
  await fetch(`${backendOrigin}/sanctum/csrf-cookie`, { credentials: "include" });
}

function tenantHostHeader(): Record<string, string> {
  if (typeof window === "undefined" || window.location.hostname === "") {
    return {};
  }

  return { "X-Tenant-Host": window.location.hostname };
}

const fieldClass =
  "w-full rounded-[1rem] border border-[#cfe0f4] bg-[#faf9f5] px-4 py-3.5 text-sm text-[#0a1628] shadow-[0_10px_26px_rgba(10,55,120,0.04)] outline-none transition placeholder:text-[#8ea6c3] focus:border-[#048dfe] focus:ring-4 focus:ring-[rgba(4,141,254,0.12)]";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    const email = String(formData.get("email") ?? "");

    startTransition(async () => {
      try {
        await ensureCsrfCookie();
        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/forgot-password`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...tenantHostHeader(),
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;
          setError(payload?.message ?? payload?.errors?.email?.[0] ?? t("forgotPasswordError"));
          return;
        }

        const payload = (await response.json()) as { message?: string };
        setMessage(payload.message ?? t("forgotPasswordSuccess"));
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-[#123055]">{t("emailLabel")}</label>
        <div className="relative">
          <div className="pointer-events-none absolute start-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#7f99bb]">
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 7.5l7.89 5.26a2 2 0 002.22 0L21 7.5M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={t("emailPlaceholder")}
            className={`${fieldClass} ps-12`}
          />
        </div>
      </div>

      {message ? (
        <div className="rounded-[1rem] border border-[#ccebd8] bg-[#f2fbf6] px-4 py-3 text-sm leading-6 text-[#1f7a46]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1rem] border border-[#ffd5d2] bg-[#fff4f3] px-4 py-3 text-sm leading-6 text-[#b7382d]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#048DFE_0%,#036DEB_52%,#0054C5_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-[0_18px_38px_rgba(4,109,235,0.26)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_46px_rgba(4,109,235,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? t("sendingResetLink") : t("forgotPasswordButton")}
      </button>

      <div className="text-center text-sm leading-7 text-[#58718c]">
        <Link
          href={localePath(locale, "/auth/login")}
          className="font-semibold text-[#036deb] transition hover:text-[#002d8e]"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </form>
  );
}
