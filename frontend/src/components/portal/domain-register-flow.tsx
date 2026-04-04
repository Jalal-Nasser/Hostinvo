"use client";

import { useState } from "react";
import Link from "next/link";

import { portalTheme } from "@/components/portal/portal-theme";
import { localePath } from "@/lib/auth";

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
    searchButton: string;
    infoNote: string;
    resultsKicker: string;
    resultsTitle: string;
    resultsDescription: string;
    availableLabel: string;
    unavailableLabel: string;
    addToCartButton: string;
    transferInsteadButton: string;
    mockCartMessage: string;
  };
};

type DomainSearchResult = {
  domain: string;
  status: "available" | "unavailable";
  price: string;
};

const availableTlds = [".com", ".net", ".org", ".sa"];

function normalizeDomainSeed(input: string): string {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return "example";
  }

  return trimmed.replace(/^www\./, "").split(".")[0] || "example";
}

function buildMockResults(seed: string, preferredTld: string): DomainSearchResult[] {
  const results: DomainSearchResult[] = [
    { domain: `${seed}.com`, status: "unavailable", price: "$12.99 / year" },
    { domain: `${seed}.net`, status: "available", price: "$10.99 / year" },
    { domain: `${seed}.org`, status: "available", price: "$9.49 / year" },
    { domain: `${seed}.sa`, status: "unavailable", price: "$34.00 / year" },
  ];

  return results.sort((left, right) => {
    if (left.domain.endsWith(preferredTld)) {
      return -1;
    }

    if (right.domain.endsWith(preferredTld)) {
      return 1;
    }

    return 0;
  });
}

export function DomainRegisterFlow({
  locale,
  initialQuery = "",
  initialTld = ".com",
  labels,
}: DomainRegisterFlowProps) {
  const parsedInitialQuery = normalizeDomainSeed(initialQuery);
  const [domainQuery, setDomainQuery] = useState(
    parsedInitialQuery === "example" && !initialQuery ? "" : parsedInitialQuery,
  );
  const [selectedTld, setSelectedTld] = useState(initialTld);
  const [results, setResults] = useState<DomainSearchResult[]>(
    initialQuery ? buildMockResults(parsedInitialQuery, initialTld) : [],
  );
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const seed = normalizeDomainSeed(domainQuery);

    setCartMessage(null);
    setResults(buildMockResults(seed, selectedTld));
  }

  function handleTldSelection(tld: string) {
    setSelectedTld(tld);
    setCartMessage(null);

    if (domainQuery.trim()) {
      setResults(buildMockResults(normalizeDomainSeed(domainQuery), tld));
    }
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

        <form className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSearch}>
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#dbe7ff]">{labels.domainInputLabel}</span>
              <input
                className={portalTheme.fieldClass}
                onChange={(event) => setDomainQuery(event.target.value)}
                placeholder={labels.domainInputPlaceholder}
                value={domainQuery}
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-[#dbe7ff]">{labels.suggestedTldsLabel}</span>
              <div className="flex flex-wrap items-center gap-2">
                {availableTlds.map((tld) => (
                  <button
                    key={tld}
                    className={[
                      portalTheme.chipClass,
                      selectedTld === tld ? portalTheme.chipActiveClass : "",
                    ].join(" ")}
                    onClick={() => handleTldSelection(tld)}
                    type="button"
                  >
                    {tld}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button className={[portalTheme.primaryButtonClass, "w-full lg:w-auto"].join(" ")} type="submit">
              {labels.searchButton}
            </button>
          </div>
        </form>

        <div className={[portalTheme.noteClass, "mt-5"].join(" ")}>{labels.infoNote}</div>
      </section>

      {results.length > 0 ? (
        <section className={[portalTheme.surfaceClass, "ps-6 pe-6 py-6 md:ps-7 md:pe-7 md:py-7"].join(" ")}>
          <div className="flex flex-col gap-2 border-b border-[rgba(104,123,158,0.12)] pb-4">
            <p className={portalTheme.sectionKickerClass}>{labels.resultsKicker}</p>
            <h3 className="text-xl font-semibold text-white">{labels.resultsTitle}</h3>
            <p className="text-sm leading-7 text-[#aebad4]">{labels.resultsDescription}</p>
          </div>

          <div className="mt-5 grid gap-3">
            {results.map((result) => {
              const isSelectedTld = result.domain.endsWith(selectedTld);

              return (
                <article
                  key={result.domain}
                  className={[
                    "rounded-[12px] border ps-4 pe-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                    result.status === "available"
                      ? "border-[rgba(94,157,126,0.22)] bg-[linear-gradient(180deg,rgba(48,66,56,0.42)_0%,rgba(38,50,47,0.42)_100%)]"
                      : "border-[rgba(104,123,158,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_100%)]",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-white">{result.domain}</h4>
                        {isSelectedTld ? (
                          <span className="rounded-full bg-[rgba(52,134,255,0.16)] ps-3 pe-3 py-1 text-xs font-semibold text-[#dfe9ff]">
                            {selectedTld}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#afbed8]">
                        <span>
                          {result.status === "available"
                            ? labels.availableLabel
                            : labels.unavailableLabel}
                        </span>
                        <span className="text-[#6f85aa]">/</span>
                        <span>{result.price}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {result.status === "available" ? (
                        <button
                          className={portalTheme.primaryButtonClass}
                          onClick={() => setCartMessage(`${result.domain} ${labels.mockCartMessage}`)}
                          type="button"
                        >
                          {labels.addToCartButton}
                        </button>
                      ) : (
                        <Link
                          className={portalTheme.secondaryButtonClass}
                          href={`${localePath(locale, "/portal/domains/transfer")}?query=${encodeURIComponent(result.domain)}`}
                        >
                          {labels.transferInsteadButton}
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {cartMessage ? (
            <div className="mt-5 rounded-[12px] border border-[rgba(94,157,126,0.24)] bg-[rgba(39,78,57,0.34)] ps-4 pe-4 py-3 text-sm text-[#d8f7e4]">
              {cartMessage}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
