"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { portalTheme } from "@/components/portal/portal-theme";
import { localePath } from "@/lib/auth";
import { fetchAuthConfig, type AuthConfigResponse } from "@/lib/auth-security";
import { createPortalTicketRequest } from "@/lib/portal-ticket-requests";

type DomainRegisterFlowProps = {
  locale: string;
  initialQuery?: string;
  initialTld?: string;
  labels: {
    sectionKicker: string;
    formTitle: string;
    formDescription: string;
    domainInputLabel: string;
    domainInputPlaceholder: string;
    suggestedTldsLabel: string;
    submitButton: string;
    submittingButton: string;
    infoNote: string;
    requestPreviewLabel: string;
    requestPreviewDescription: string;
    errorMessage: string;
  };
};

const suggestedTlds = [".com", ".net", ".org", ".sa"];

function normalizeBaseName(input: string): string {
  return input.trim().replace(/^www\./i, "").replace(/\.+$/, "");
}

function buildRequestedDomain(domainName: string, selectedTld: string): string {
  const normalized = normalizeBaseName(domainName);

  if (!normalized) {
    return "";
  }

  if (normalized.includes(".")) {
    return normalized.toLowerCase();
  }

  return `${normalized.toLowerCase()}${selectedTld}`;
}

export function DomainRegisterFlow({
  locale,
  initialQuery = "",
  initialTld = ".com",
  labels,
}: DomainRegisterFlowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [domainName, setDomainName] = useState(initialQuery);
  const [selectedTld, setSelectedTld] = useState(initialTld);
  const [error, setError] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthConfigResponse | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  const requestedDomain = buildRequestedDomain(domainName, selectedTld);
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

    if (!requestedDomain) {
      setError(labels.errorMessage);
      return;
    }

    startTransition(async () => {
      try {
        const ticket = await createPortalTicketRequest({
          subject: `Domain registration request: ${requestedDomain}`,
          priority: "medium",
          message: [
            "A client submitted a domain registration request from the portal.",
            "",
            `Requested domain: ${requestedDomain}`,
            `Preferred TLD: ${selectedTld}`,
            "",
            "Live registrar availability lookup is not connected yet.",
            "Please review this request manually and advise the client on next steps.",
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

        <form className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#dbe7ff]">{labels.domainInputLabel}</span>
              <input
                className={portalTheme.fieldClass}
                onChange={(event) => setDomainName(event.target.value)}
                placeholder={labels.domainInputPlaceholder}
                value={domainName}
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-[#dbe7ff]">{labels.suggestedTldsLabel}</span>
              <div className="flex flex-wrap items-center gap-2">
                {suggestedTlds.map((tld) => (
                  <button
                    key={tld}
                    className={[
                      portalTheme.chipClass,
                      selectedTld === tld ? portalTheme.chipActiveClass : "",
                    ].join(" ")}
                    onClick={() => setSelectedTld(tld)}
                    type="button"
                  >
                    {tld}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button
              className={[portalTheme.primaryButtonClass, "w-full lg:w-auto disabled:opacity-60"].join(" ")}
              disabled={isPending}
              type="submit"
            >
              {isPending ? labels.submittingButton : labels.submitButton}
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
        <p className={portalTheme.sectionKickerClass}>{labels.requestPreviewLabel}</p>
        <h3 className="mt-2 text-xl font-semibold text-white">
          {requestedDomain || labels.domainInputPlaceholder}
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
          {labels.requestPreviewDescription}
        </p>
      </section>
    </div>
  );
}
