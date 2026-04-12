"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { portalTheme } from "@/components/portal/portal-theme";
import { localePath } from "@/lib/auth";
import { fetchAuthConfig, type AuthConfigResponse } from "@/lib/auth-security";
import { createPortalTicketRequest } from "@/lib/portal-ticket-requests";

type DomainTransferFlowProps = {
  locale: string;
  initialQuery?: string;
  labels: {
    sectionKicker: string;
    formTitle: string;
    formDescription: string;
    domainInputLabel: string;
    domainInputPlaceholder: string;
    authCodeLabel: string;
    authCodePlaceholder: string;
    continueButton: string;
    submittingButton: string;
    infoNote: string;
    requestSummaryTitle: string;
    requestSummaryDescription: string;
    errorMessage: string;
  };
};

function normalizeDomain(input: string): string {
  return input.trim().replace(/^www\./i, "").replace(/\.+$/, "").toLowerCase();
}

export function DomainTransferFlow({
  locale,
  initialQuery = "",
  labels,
}: DomainTransferFlowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [domainName, setDomainName] = useState(initialQuery);
  const [authCode, setAuthCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthConfigResponse | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const showTurnstile =
    authConfig !== null &&
    authConfig.turnstile.enabled &&
    authConfig.turnstile.forms["portal_support"] === true;

  useEffect(() => {
    fetchAuthConfig().then(setAuthConfig);
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedDomain = normalizeDomain(domainName);
    const trimmedAuthCode = authCode.trim();

    if (!normalizedDomain || !trimmedAuthCode) {
      setError(labels.errorMessage);
      return;
    }

    startTransition(async () => {
      try {
        const ticket = await createPortalTicketRequest({
          subject: `Domain transfer request: ${normalizedDomain}`,
          priority: "medium",
          message: [
            "A client submitted a domain transfer request from the portal.",
            "",
            `Domain: ${normalizedDomain}`,
            `Auth / EPP code: ${trimmedAuthCode}`,
            "",
            "This request requires manual registrar-side processing.",
            "Live transfer validation is not connected yet, so please review the request manually and contact the client with the next step.",
          ].join("\n"),
          ...(showTurnstile && turnstileToken ? { turnstile_token: turnstileToken } : {}),
        });

        router.replace(localePath(locale, `/portal/tickets/${ticket.id}`));
        router.refresh();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error && submissionError.message
            ? submissionError.message
            : labels.errorMessage,
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className={[portalTheme.panelClass, "ps-6 pe-6 py-6 md:ps-7 md:pe-7 md:py-7"].join(" ")}>
        <div className="max-w-3xl">
          <p className={portalTheme.sectionKickerClass}>{labels.sectionKicker}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
            {labels.formTitle}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#aebad4]">{labels.formDescription}</p>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[#dbe7ff]">{labels.domainInputLabel}</span>
            <input
              className={portalTheme.fieldClass}
              onChange={(event) => setDomainName(event.target.value)}
              placeholder={labels.domainInputPlaceholder}
              value={domainName}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[#dbe7ff]">{labels.authCodeLabel}</span>
            <input
              className={portalTheme.fieldClass}
              onChange={(event) => setAuthCode(event.target.value)}
              placeholder={labels.authCodePlaceholder}
              value={authCode}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <button
              className={[portalTheme.primaryButtonClass, "disabled:opacity-60"].join(" ")}
              disabled={isPending}
              type="submit"
            >
              {isPending ? labels.submittingButton : labels.continueButton}
            </button>
          </div>
        </form>

        {error ? (
          <p className="mt-5 rounded-[12px] border border-[rgba(235,87,87,0.28)] bg-[rgba(108,31,45,0.32)] ps-4 pe-4 py-3 text-sm text-[#ffd6d6]">
            {error}
          </p>
        ) : null}

        {showTurnstile ? (
          <div className="mt-5">
            <TurnstileWidget
              locale={locale}
              siteKey={authConfig?.turnstile.site_key ?? ""}
              onTokenChange={setTurnstileToken}
            />
          </div>
        ) : null}

        <div className={[portalTheme.noteClass, "mt-5"].join(" ")}>{labels.infoNote}</div>
      </section>

      <section className={[portalTheme.surfaceClass, "ps-6 pe-6 py-6 md:ps-7 md:pe-7 md:py-7"].join(" ")}>
        <h3 className="text-xl font-semibold text-white">{labels.requestSummaryTitle}</h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
          {labels.requestSummaryDescription}
        </p>
      </section>
    </div>
  );
}
