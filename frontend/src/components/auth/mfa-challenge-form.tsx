"use client";

import { useEffect, useState, useTransition } from "react";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import {
  beginMfaSetup,
  confirmMfaSetup,
  fetchMfaStatus,
  submitMfaChallenge,
} from "@/lib/auth-security";
import { localePath } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Shared style constants – mirrors login-form.tsx exactly
// ---------------------------------------------------------------------------

const fieldClass =
  "w-full rounded-[1rem] border border-[#cfe0f4] bg-[#faf9f5] px-4 py-3.5 text-sm text-[#0a1628] shadow-[0_10px_26px_rgba(10,55,120,0.04)] outline-none transition placeholder:text-[#8ea6c3] focus:border-[#048dfe] focus:bg-[#faf9f5] focus:ring-4 focus:ring-[rgba(4,141,254,0.12)]";

const btnClass =
  "inline-flex w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#048DFE_0%,#036DEB_52%,#0054C5_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-[0_18px_38px_rgba(4,109,235,0.26)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_46px_rgba(4,109,235,0.34)] disabled:cursor-not-allowed disabled:opacity-60";

const errorBoxClass =
  "rounded-[1rem] border border-[#ffd5d2] bg-[#fff4f3] px-4 py-3 text-sm leading-6 text-[#b7382d]";

const recoveryBoxClass =
  "rounded-[1rem] border border-[#dbe7f5] bg-[#f8fbff] p-4 font-mono text-sm text-[#0a1628]";

// ---------------------------------------------------------------------------
// Internal view-state discriminated union
// ---------------------------------------------------------------------------

type ViewState =
  | { kind: "loading" }
  | { kind: "session_expired"; message: string }
  | { kind: "challenge" }
  | { kind: "setup"; secret: string; otpAuthUrl: string }
  | { kind: "recovery_codes"; codes: string[] };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div className="flex items-center justify-center py-14">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#cfe0f4] border-t-[#048dfe]" />
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#048dfe] text-[11px] font-bold leading-none text-white">
      {n}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MfaChallengeForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [useRecovery, setUseRecovery] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Bootstrap: fetch MFA status on mount, then begin setup if needed
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const statusResult = await fetchMfaStatus();

      if (cancelled) return;

      // Already fully authenticated – go straight to the dashboard
      if (statusResult.data?.state === "authenticated") {
        router.replace(localePath(locale, "/dashboard"));
        return;
      }

      if (statusResult.data?.state === "pending") {
        const mfa = statusResult.data.mfa;

        if (mfa.mode === "challenge") {
          setView({ kind: "challenge" });
          return;
        }

        if (mfa.mode === "setup") {
          // POST /auth/mfa/setup to receive the QR / secret
          const setupResult = await beginMfaSetup();

          if (cancelled) return;

          // Backend confirmed setup is already done
          if (setupResult.data?.state === "authenticated") {
            router.replace(localePath(locale, "/dashboard"));
            return;
          }

          if (setupResult.data?.setup) {
            setView({
              kind: "setup",
              secret: setupResult.data.setup.secret,
              otpAuthUrl: setupResult.data.setup.otp_auth_url,
            });
            return;
          }

          // beginMfaSetup failed
          setView({
            kind: "session_expired",
            message: setupResult.error ?? t("serviceUnavailable"),
          });
          return;
        }
      }

      // Any other response (401, network error, unexpected body) →
      // treat as expired / unavailable MFA session
      const message =
        statusResult.status === 0
          ? t("serviceUnavailable")
          : statusResult.status === 401 || !statusResult.data
          ? t("mfaSessionExpired")
          : (statusResult.error ?? t("mfaSessionExpired"));

      setView({ kind: "session_expired", message });
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [locale, router, t]);

  // -------------------------------------------------------------------------
  // Challenge form handler
  // -------------------------------------------------------------------------

  function handleChallengeSubmit(formData: FormData) {
    setSubmitError(null);

    const code = String(formData.get("code") ?? "");
    const recoveryCode = String(formData.get("recovery_code") ?? "");

    startTransition(async () => {
      const payload = useRecovery ? { recovery_code: recoveryCode } : { code };
      const result = await submitMfaChallenge(payload);

      if (result.data?.status === "authenticated") {
        router.replace(localePath(locale, "/dashboard"));
        router.refresh();
        return;
      }

      setSubmitError(result.error ?? t("mfaChallengeError"));
    });
  }

  // -------------------------------------------------------------------------
  // Setup confirm form handler
  // -------------------------------------------------------------------------

  function handleSetupSubmit(formData: FormData) {
    setSubmitError(null);

    const code = String(formData.get("code") ?? "");

    startTransition(async () => {
      const result = await confirmMfaSetup({ code });

      if (result.data?.recovery_codes) {
        setView({ kind: "recovery_codes", codes: result.data.recovery_codes });
        return;
      }

      setSubmitError(result.error ?? t("mfaSetupConfirmError"));
    });
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // — Loading spinner —
  if (view.kind === "loading") {
    return <Spinner />;
  }

  // — Session expired / service unavailable —
  if (view.kind === "session_expired") {
    return (
      <div className="grid gap-5">
        <div className={errorBoxClass}>{view.message}</div>
        <a href={localePath(locale, "/auth/login")} className={btnClass}>
          {t("backToLogin")}
        </a>
      </div>
    );
  }

  // — Recovery codes saved screen —
  if (view.kind === "recovery_codes") {
    return (
      <div className="grid gap-6">
        <div>
          <h2 className="text-lg font-semibold text-[#0a1628]">
            {t("mfaRecoveryCodesTitle")}
          </h2>
          <p className="mt-2 text-[15px] leading-7 text-[#4e6782]">
            {t("mfaRecoveryCodesBody")}
          </p>
        </div>

        <div className={recoveryBoxClass}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {view.codes.map((c) => (
              <div key={c} className="select-all py-0.5">
                {c}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            router.replace(localePath(locale, "/dashboard"));
            router.refresh();
          }}
          className={btnClass}
        >
          {t("mfaRecoveryCodesDone")}
        </button>
      </div>
    );
  }

  // — Challenge (TOTP / recovery code) —
  if (view.kind === "challenge") {
    return (
      <form action={handleChallengeSubmit} className="grid gap-6">
        <div className="grid gap-5">
          {useRecovery ? (
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[#123055]">
                {t("mfaRecoveryLabel")}
              </label>
              <input
                key="recovery"
                type="text"
                name="recovery_code"
                placeholder={t("mfaRecoveryPlaceholder")}
                autoComplete="one-time-code"
                autoFocus
                className={fieldClass}
                required
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[#123055]">
                {t("mfaChallengeLabel")}
              </label>
              <input
                key="totp"
                type="text"
                name="code"
                placeholder={t("mfaChallengePlaceholder")}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                className={fieldClass}
                required
              />
            </div>
          )}
        </div>

        {/* Recovery / TOTP toggle */}
        <button
          type="button"
          onClick={() => {
            setUseRecovery((v) => !v);
            setSubmitError(null);
          }}
          className="text-start text-sm font-medium text-[#036deb] transition hover:text-[#002d8e]"
        >
          {useRecovery ? t("mfaCodeToggle") : t("mfaRecoveryToggle")}
        </button>

        {submitError ? (
          <div className={errorBoxClass}>{submitError}</div>
        ) : null}

        <button type="submit" disabled={isPending} className={btnClass}>
          {isPending ? t("mfaVerifyingCode") : t("mfaChallengeButton")}
        </button>
      </form>
    );
  }

  // — Setup (QR + secret + confirm code) —
  if (view.kind === "setup") {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      view.otpAuthUrl,
    )}`;

    return (
      <form action={handleSetupSubmit} className="grid gap-6">
        {/* Numbered steps */}
        <ol className="grid gap-3">
          {(
            [
              t("mfaSetupStep1"),
              t("mfaSetupStep2"),
              t("mfaSetupStep3"),
            ] as string[]
          ).map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <StepBadge n={i + 1} />
              <span className="text-[15px] leading-6 text-[#4e6782]">{step}</span>
            </li>
          ))}
        </ol>

        {/* QR code image + manual setup key */}
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-[1rem] border border-[#dbe7f5] bg-white p-3 shadow-[0_4px_16px_rgba(10,55,120,0.06)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="QR code for authenticator app setup"
              width={200}
              height={200}
              className="block"
            />
          </div>

          <div className="w-full">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7ca5]">
              {t("mfaSetupKeyLabel")}
            </p>
            <div className="mt-1.5 cursor-text select-all break-all rounded-[1rem] border border-[#dbe7f5] bg-[#f8fbff] px-4 py-2.5 font-mono text-sm text-[#0a1628]">
              {view.secret}
            </div>
          </div>
        </div>

        {/* Code input */}
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-[#123055]">
            {t("mfaChallengeLabel")}
          </label>
          <input
            type="text"
            name="code"
            placeholder={t("mfaChallengePlaceholder")}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            className={fieldClass}
            required
          />
        </div>

        {submitError ? (
          <div className={errorBoxClass}>{submitError}</div>
        ) : null}

        <button type="submit" disabled={isPending} className={btnClass}>
          {isPending ? t("mfaSetupConfirmingButton") : t("mfaSetupConfirmButton")}
        </button>
      </form>
    );
  }

  return null;
}
