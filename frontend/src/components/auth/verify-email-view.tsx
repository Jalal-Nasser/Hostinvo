"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { localePath } from "@/lib/auth";
import { resendVerificationEmail } from "@/lib/auth-security";

type Props = {
  status: string | null;
  email: string | null;
};

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-7 w-7"}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M3 7.5l7.89 5.26a2 2 0 002.22 0L21 7.5M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-7 w-7"}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-7 w-7"}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  );
}

// ── Shared style constants ────────────────────────────────────────────────────

const primaryBtn =
  "inline-flex w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#048DFE_0%,#036DEB_52%,#0054C5_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-[0_18px_38px_rgba(4,109,235,0.26)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_46px_rgba(4,109,235,0.34)] disabled:cursor-not-allowed disabled:opacity-60";

// ── Component ─────────────────────────────────────────────────────────────────

export function VerifyEmailView({ status, email }: Props) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const isSuccess = status === "verified" || status === "already_verified";
  const isInvalid = status === "invalid";

  function handleResend() {
    if (!email) return;
    setResendMessage(null);
    setResendError(null);

    startTransition(async () => {
      const result = await resendVerificationEmail({ email, locale });

      if (result.status === 0) {
        setResendError(t("serviceUnavailable"));
      } else if (result.error) {
        setResendError(result.error);
      } else {
        setResendMessage(t("resendVerificationSuccess"));
      }
    });
  }

  // ── Scenario B: verified / already_verified ───────────────────────────────

  if (isSuccess) {
    const isAlready = status === "already_verified";

    return (
      <div className="grid gap-6">
        <div className="rounded-[1rem] border border-[#ccebd8] bg-[#f2fbf6] p-5 text-sm leading-6 text-[#1f7a46]">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 shrink-0">
              <CheckIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-semibold">
                {isAlready ? t("verifyEmailAlreadyTitle") : t("verifyEmailSuccessTitle")}
              </p>
              <p className="mt-1">
                {isAlready ? t("verifyEmailAlreadyBody") : t("verifyEmailSuccessBody")}
              </p>
            </div>
          </div>
        </div>

        <Link href={localePath(locale, "/auth/login")} className={primaryBtn}>
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  // ── Scenario C: invalid ───────────────────────────────────────────────────

  if (isInvalid) {
    return (
      <div className="grid gap-6">
        <div className="rounded-[1rem] border border-[#ffd5d2] bg-[#fff4f3] p-5 text-sm leading-6 text-[#b7382d]">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 shrink-0">
              <WarningIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-semibold">{t("verifyEmailInvalidTitle")}</p>
              <p className="mt-1">{t("verifyEmailInvalidBody")}</p>
            </div>
          </div>
        </div>

        {resendMessage ? (
          <div className="rounded-[1rem] border border-[#ccebd8] bg-[#f2fbf6] px-4 py-3 text-sm leading-6 text-[#1f7a46]">
            {resendMessage}
          </div>
        ) : null}

        {resendError ? (
          <div className="rounded-[1rem] border border-[#ffd5d2] bg-[#fff4f3] px-4 py-3 text-sm leading-6 text-[#b7382d]">
            {resendError}
          </div>
        ) : null}

        {email ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={isPending}
            className={primaryBtn}
          >
            {isPending ? t("resendingVerification") : t("resendVerificationButton")}
          </button>
        ) : null}

        <div className="text-center text-sm leading-7 text-[#58718c]">
          <Link
            href={localePath(locale, "/auth/login")}
            className="font-semibold text-[#036deb] transition hover:text-[#002d8e]"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  // ── Scenario A: pending (null or "pending") ───────────────────────────────

  const pendingBody = t("verifyEmailPendingBody").replace("{{email}}", email ?? "");

  return (
    <div className="grid gap-6">
      <div className="rounded-[1rem] border border-[#dbe7f5] bg-[#f8fbff] p-5 text-sm leading-6 text-[#2d5a8c]">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 shrink-0">
            <EnvelopeIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-semibold">{t("verifyEmailPendingTitle")}</p>
            <p className="mt-1">{pendingBody}</p>
          </div>
        </div>
      </div>

      {resendMessage ? (
        <div className="rounded-[1rem] border border-[#ccebd8] bg-[#f2fbf6] px-4 py-3 text-sm leading-6 text-[#1f7a46]">
          {resendMessage}
        </div>
      ) : null}

      {resendError ? (
        <div className="rounded-[1rem] border border-[#ffd5d2] bg-[#fff4f3] px-4 py-3 text-sm leading-6 text-[#b7382d]">
          {resendError}
        </div>
      ) : null}

      {email ? (
        <button
          type="button"
          onClick={handleResend}
          disabled={isPending}
          className={primaryBtn}
        >
          {isPending ? t("resendingVerification") : t("resendVerificationButton")}
        </button>
      ) : null}

      <div className="text-center text-sm leading-7 text-[#58718c]">
        <Link
          href={localePath(locale, "/auth/login")}
          className="font-semibold text-[#036deb] transition hover:text-[#002d8e]"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
