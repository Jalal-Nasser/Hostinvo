"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition, useEffect } from "react";

import { localePath } from "@/lib/auth";
import {
  fetchAuthConfig,
  submitPasswordReset,
  type AuthConfigResponse,
} from "@/lib/auth-security";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";

const fieldClass =
  "w-full rounded-[1rem] border border-[#cfe0f4] bg-[#faf9f5] px-4 py-3.5 text-sm text-[#0a1628] shadow-[0_10px_26px_rgba(10,55,120,0.04)] outline-none transition placeholder:text-[#8ea6c3] focus:border-[#048dfe] focus:ring-4 focus:ring-[rgba(4,141,254,0.12)]";

type ResetPasswordFormProps = {
  initialEmail?: string;
  token?: string;
  tenantId?: string;
  tenantSignature?: string;
};

function PasswordToggle({
  visible,
  onToggle,
  label,
}: {
  visible: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute end-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#7f99bb] transition hover:bg-[#eff6ff] hover:text-[#036deb]"
      aria-label={label}
    >
      {visible ? (
        <svg
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 3l18 18M10.58 10.58A3 3 0 0012 15a3 3 0 002.12-.88M9.88 5.09A9.77 9.77 0 0112 5c4.48 0 8.27 2.94 9.54 7a9.73 9.73 0 01-3.01 4.29M6.23 6.23A9.73 9.73 0 002.46 12c1.27 4.06 5.06 7 9.54 7a9.8 9.8 0 005.09-1.41"
          />
        </svg>
      ) : (
        <svg
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7S3.73 16.06 2.46 12z"
          />
        </svg>
      )}
    </button>
  );
}

export function ResetPasswordForm({
  initialEmail,
  token,
  tenantId,
  tenantSignature,
}: ResetPasswordFormProps) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfigResponse | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const hasToken = Boolean(token);

  useEffect(() => {
    fetchAuthConfig().then(setAuthConfig);
  }, []);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(
      formData.get("password_confirmation") ?? "",
    );

    if (!hasToken) {
      setError(t("tokenMissing"));
      return;
    }

    startTransition(async () => {
      const result = await submitPasswordReset({
        token: token!,
        email,
        tenant_id: tenantId,
        tenant_signature: tenantSignature,
        password,
        password_confirmation: passwordConfirmation,
        turnstile_token: turnstileToken || undefined,
      });

      if (result.error === null) {
        setMessage(result.data?.message ?? t("resetPasswordSuccess"));
      } else {
        setError(result.error ?? t("resetPasswordError"));
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-6">
      {!hasToken ? (
        <div className="rounded-[1rem] border border-[#fde4b3] bg-[#fff9ec] px-4 py-3 text-sm leading-6 text-[#9a6500]">
          {t("tokenMissing")}
        </div>
      ) : null}

      <div className="grid gap-5">
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-[#123055]">
            {t("emailLabel")}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute start-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#7f99bb]">
              <svg
                className="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              defaultValue={initialEmail}
              placeholder={t("emailPlaceholder")}
              className={`${fieldClass} ps-12`}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-[#123055]">
            {t("passwordLabel")}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute start-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#7f99bb]">
              <svg
                className="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder={t("passwordPlaceholder")}
              className={`${fieldClass} ps-12 pe-12`}
            />
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              label={showPassword ? t("hidePassword") : t("showPassword")}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-[#123055]">
            {t("passwordConfirmationLabel")}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute start-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#7f99bb]">
              <svg
                className="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <input
              name="password_confirmation"
              type={showConfirmation ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder={t("passwordConfirmationPlaceholder")}
              className={`${fieldClass} ps-12 pe-12`}
            />
            <PasswordToggle
              visible={showConfirmation}
              onToggle={() => setShowConfirmation((value) => !value)}
              label={showConfirmation ? t("hidePassword") : t("showPassword")}
            />
          </div>
        </div>
      </div>

      {authConfig?.turnstile.enabled &&
      authConfig.turnstile.forms["reset_password"] ? (
        <TurnstileWidget
          locale={locale}
          siteKey={authConfig.turnstile.site_key}
          onTokenChange={setTurnstileToken}
        />
      ) : null}

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
        disabled={isPending || !hasToken}
        className="inline-flex w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#048DFE_0%,#036DEB_52%,#0054C5_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-[0_18px_38px_rgba(4,109,235,0.26)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_46px_rgba(4,109,235,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? t("resettingPassword") : t("resetPasswordButton")}
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
