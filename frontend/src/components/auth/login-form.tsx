"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { localePath } from "@/lib/auth";
import {
  beginPasskeyAuthentication,
  fetchAuthConfig,
  finishPasskeyAuthentication,
  submitLogin,
  type AuthConfigResponse,
} from "@/lib/auth-security";
import { serializeCredential, toRequestOptions } from "@/lib/webauthn";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";

const fieldClass =
  "w-full rounded-[1rem] border border-[#cfe0f4] bg-[#faf9f5] px-4 py-3.5 text-sm text-[#0a1628] shadow-[0_10px_26px_rgba(10,55,120,0.04)] outline-none transition placeholder:text-[#8ea6c3] focus:border-[#048dfe] focus:bg-[#faf9f5] focus:ring-4 focus:ring-[rgba(4,141,254,0.12)]";

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute start-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#7f99bb]">
      {children}
    </div>
  );
}

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

export function LoginForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfigResponse | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  useEffect(() => {
    fetchAuthConfig().then((config) => setAuthConfig(config));
  }, []);

  useEffect(() => {
    setPasskeySupported(typeof window !== "undefined" && "PublicKeyCredential" in window);
  }, []);

  const showTurnstile =
    authConfig !== null &&
    authConfig.turnstile.enabled &&
    authConfig.turnstile.forms["login"] === true;

  function handleSubmit(formData: FormData) {
    setError(null);
    setPasskeyError(null);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const remember = formData.get("remember") === "on";

    startTransition(async () => {
      const result = await submitLogin(
        {
          email,
          password,
          remember,
          ...(showTurnstile && turnstileToken
            ? { turnstile_token: turnstileToken }
            : {}),
        },
        locale,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError(t("loginError"));
        return;
      }

      const { status, redirectTo } = result.data;

      if (status === "authenticated") {
        router.replace(redirectTo ?? localePath(locale, "/dashboard"));
        router.refresh();
        return;
      }

      if (status === "mfa_required" || status === "mfa_setup_required") {
        router.replace(localePath(locale, "/auth/mfa"));
        return;
      }

      setError(t("loginError"));
    });
  }

  function handlePasskeyLogin() {
    setError(null);
    setPasskeyError(null);

    startTransition(async () => {
      if (!passkeySupported) {
        setPasskeyError(t("passkeyNotSupported"));
        return;
      }

      const options = await beginPasskeyAuthentication(
        emailValue ? { email: emailValue } : undefined,
      );
      if (!options.data) {
        setPasskeyError(options.error ?? t("passkeyStartError"));
        return;
      }

      try {
        const requestOptions = toRequestOptions(options.data);
        const credential = (await navigator.credentials.get({
          publicKey: requestOptions,
        })) as PublicKeyCredential | null;

        if (!credential) {
          setPasskeyError(t("passkeyCancelled"));
          return;
        }

        const result = await finishPasskeyAuthentication({
          credential: serializeCredential(credential),
        });

        if (!result.data || result.data.status !== "authenticated") {
          setPasskeyError(result.error ?? t("passkeyVerifyError"));
          return;
        }

        router.replace(result.data.redirectTo ?? localePath(locale, "/dashboard"));
        router.refresh();
      } catch {
        setPasskeyError(t("passkeyVerifyError"));
      }
    });
  }

  const isVerificationError = error !== null && /verification/i.test(error);

  return (
    <form action={handleSubmit} className="grid gap-6">
      <div className="grid gap-5">
        {/* ── Email ── */}
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-[#123055]">
            {t("emailLabel")}
          </label>
          <div className="relative">
            <FieldIcon>
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
            </FieldIcon>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("emailPlaceholder")}
              className={`${fieldClass} ps-12`}
              value={emailValue}
              onChange={(event) => setEmailValue(event.target.value)}
            />
          </div>
        </div>

        {/* ── Password ── */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-[#123055]">
              {t("passwordLabel")}
            </label>
            <Link
              href={localePath(locale, "/auth/forgot-password")}
              className="text-sm font-semibold text-[#036deb] transition hover:text-[#002d8e]"
            >
              {t("forgotPasswordLink")}
            </Link>
          </div>
          <div className="relative">
            <FieldIcon>
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
            </FieldIcon>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder={t("passwordPlaceholder")}
              className={`${fieldClass} ps-12 pe-12`}
            />
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              label={showPassword ? t("hidePassword") : t("showPassword")}
            />
          </div>
        </div>
      </div>

      {/* ── Remember me ── */}
      <label className="flex items-center gap-3 text-sm text-[#4d6783]">
        <input
          name="remember"
          type="checkbox"
          className="h-4.5 w-4.5 rounded border-[#b9d0ea] text-[#048dfe] accent-[#048dfe]"
        />
        <span>{t("rememberLabel")}</span>
      </label>

      {/* ── Turnstile (conditional) ── */}
      {showTurnstile ? (
        <TurnstileWidget
          locale={locale}
          siteKey={authConfig?.turnstile.site_key ?? ""}
          onTokenChange={(token) => setTurnstileToken(token)}
        />
      ) : null}

      {/* ── Error box ── */}
      {error ? (
        <div className="rounded-[1rem] border border-[#ffd5d2] bg-[#fff4f3] px-4 py-3 text-sm leading-6 text-[#b7382d]">
          <p>{error}</p>
          {isVerificationError ? (
            <p className="mt-1">
              <Link
                href={localePath(locale, "/auth/verify-email")}
                className="font-semibold underline transition hover:text-[#8b2920]"
              >
                {t("verifyEmailTitle")}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#048DFE_0%,#036DEB_52%,#0054C5_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-[0_18px_38px_rgba(4,109,235,0.26)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_46px_rgba(4,109,235,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? t("loggingIn") : t("loginButton")}
      </button>

      {/* ── Divider ── */}
      {passkeySupported ? (
        <button
          type="button"
          onClick={handlePasskeyLogin}
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-[1rem] border border-[#cfe0f4] bg-white px-5 py-3.5 text-base font-semibold text-[#033466] shadow-[0_12px_26px_rgba(10,55,120,0.08)] transition hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("passkeyButton")}
        </button>
      ) : null}

      {passkeyError ? (
        <div className="rounded-[1rem] border border-[#ffd5d2] bg-[#fff4f3] px-4 py-3 text-sm leading-6 text-[#b7382d]">
          {passkeyError}
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-[#d6e3f2]" />
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#8ca4c0]">
          {t("orDivider")}
        </span>
        <div className="h-px flex-1 bg-[#d6e3f2]" />
      </div>

      {/* ── No account ── */}
      <p className="text-center text-sm leading-7 text-[#58718c]">
        {t("noAccount")}{" "}
        <Link
          href={localePath(locale, "/onboarding")}
          className="font-semibold text-[#036deb] transition hover:text-[#002d8e]"
        >
          {t("startFreeOnboarding")}
        </Link>
      </p>
    </form>
  );
}
