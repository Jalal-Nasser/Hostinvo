"use client";

import { useEffect, useRef, useState } from "react";

import { portalTheme } from "@/components/portal/portal-theme";

type PortalCurrencySelectProps = {
  label: string;
  options: string[];
  className?: string;
  showChevron?: boolean;
};

const portalCurrencyStorageKey = "portal.currency.v1";

export function PortalCurrencySelect({
  label,
  options,
  className,
  showChevron = false,
}: PortalCurrencySelectProps) {
  const normalizedOptions = Array.from(
    new Set(
      options
        .map((option) => option.trim().toUpperCase())
        .filter((option) => option.length > 0),
    ),
  );
  const fallbackCurrency = normalizedOptions[0] ?? "USD";
  const [selectedCurrency, setSelectedCurrency] = useState(fallbackCurrency);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canChangeCurrency = normalizedOptions.length > 1;

  useEffect(() => {
    const nextOptions = Array.from(
      new Set(
        options
          .map((option) => option.trim().toUpperCase())
          .filter((option) => option.length > 0),
      ),
    );
    const nextFallbackCurrency = nextOptions[0] ?? "USD";
    const storedCurrency = window.localStorage.getItem(portalCurrencyStorageKey);

    if (storedCurrency && nextOptions.includes(storedCurrency)) {
      setSelectedCurrency(storedCurrency);
      return;
    }

    setSelectedCurrency(nextFallbackCurrency);
    window.localStorage.setItem(portalCurrencyStorageKey, nextFallbackCurrency);
  }, [options]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);

    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [open]);

  function handleCurrencySelect(currency: string) {
    setSelectedCurrency(currency);
    window.localStorage.setItem(portalCurrencyStorageKey, currency);
    setOpen(false);
  }

  function joinClasses(...classes: Array<string | undefined | false>) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        className={joinClasses(
          "inline-flex items-center gap-1",
          portalTheme.utilityLinkClass,
          className,
        )}
        onClick={() => {
          if (canChangeCurrency) {
            setOpen((current) => !current);
          }
        }}
        type="button"
        aria-label={label}
        aria-expanded={canChangeCurrency ? open : undefined}
        aria-haspopup={canChangeCurrency ? "menu" : undefined}
      >
        <span>{selectedCurrency || label}</span>
        {showChevron ? (
          <svg
            aria-hidden="true"
            className={joinClasses("h-3 w-3 transition", open ? "rotate-180" : "")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="m6 9 6 6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        ) : null}
      </button>

      {open ? (
        <div className="absolute end-0 top-full z-50 mt-2 min-w-[112px] rounded-[12px] border border-[rgba(104,123,158,0.18)] bg-[linear-gradient(180deg,rgba(41,50,68,0.98)_0%,rgba(31,38,52,0.98)_100%)] p-2 shadow-[0_18px_32px_rgba(5,10,22,0.28)] backdrop-blur-xl">
          {normalizedOptions.map((option) => (
            <button
              key={option}
              className={[
                "flex w-full items-center justify-between rounded-[10px] ps-3 pe-3 py-2 text-start text-[11px] font-semibold uppercase tracking-[0.14em] transition",
                option === selectedCurrency
                  ? "bg-[rgba(62,123,255,0.18)] text-white"
                  : "text-[#cbd7ee] hover:bg-[rgba(255,255,255,0.05)] hover:text-white",
              ].join(" ")}
              onClick={() => handleCurrencySelect(option)}
              type="button"
            >
              <span>{option}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
