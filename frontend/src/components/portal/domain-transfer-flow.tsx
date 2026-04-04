"use client";

import { useState } from "react";

import { portalTheme } from "@/components/portal/portal-theme";

type DomainTransferFlowProps = {
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
    infoNote: string;
    summaryKicker: string;
    summaryTitle: string;
    summaryDescription: string;
    summaryDomainLabel: string;
    summaryAuthCodeLabel: string;
    summaryReadinessLabel: string;
    summaryNextStepLabel: string;
    summaryValidValue: string;
    summaryPendingValue: string;
  };
};

export function DomainTransferFlow({
  initialQuery = "",
  labels,
}: DomainTransferFlowProps) {
  const [domainName, setDomainName] = useState(initialQuery);
  const [authCode, setAuthCode] = useState("");
  const [submitted, setSubmitted] = useState<{
    domainName: string;
    authCode: string;
  } | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitted({
      domainName: domainName.trim() || "example.com",
      authCode: authCode.trim() || "EPP-PLACEHOLDER-12345",
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

          <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
            <button className={portalTheme.primaryButtonClass} type="submit">
              {labels.continueButton}
            </button>
          </div>
        </form>

        <div className={[portalTheme.noteClass, "mt-5"].join(" ")}>{labels.infoNote}</div>
      </section>

      {submitted ? (
        <section className={[portalTheme.surfaceClass, "ps-6 pe-6 py-6 md:ps-7 md:pe-7 md:py-7"].join(" ")}>
          <div className="border-b border-[rgba(104,123,158,0.12)] pb-4">
            <p className={portalTheme.sectionKickerClass}>{labels.summaryKicker}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{labels.summaryTitle}</h3>
            <p className="mt-2 text-sm leading-7 text-[#aebad4]">{labels.summaryDescription}</p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className={[portalTheme.subtleSurfaceClass, "ps-4 pe-4 py-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {labels.summaryDomainLabel}
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{submitted.domainName}</p>
              <p className="mt-2 text-sm text-[#b6c5df]">{labels.summaryValidValue}</p>
            </div>

            <div className={[portalTheme.subtleSurfaceClass, "ps-4 pe-4 py-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {labels.summaryAuthCodeLabel}
              </p>
              <p className="mt-3 break-all text-lg font-semibold text-white">{submitted.authCode}</p>
              <p className="mt-2 text-sm text-[#b6c5df]">{labels.summaryValidValue}</p>
            </div>

            <div className={[portalTheme.subtleSurfaceClass, "ps-4 pe-4 py-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {labels.summaryReadinessLabel}
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{labels.summaryPendingValue}</p>
              <p className="mt-2 text-sm text-[#b6c5df]">{labels.infoNote}</p>
            </div>

            <div className={[portalTheme.subtleSurfaceClass, "ps-4 pe-4 py-4"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">
                {labels.summaryNextStepLabel}
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{labels.summaryPendingValue}</p>
              <p className="mt-2 text-sm text-[#b6c5df]">
                {labels.summaryDescription}
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
