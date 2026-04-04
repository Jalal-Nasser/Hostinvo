"use client";

import { useEffect, useRef, useState } from "react";

import { portalTheme } from "@/components/portal/portal-theme";

type PortalCurrencySelectProps = {
  label: string;
  options: string[];
};

const portalCurrencyStorageKey = "hostinvo.portal.currency.v1";

export function PortalCurrencySelect({
  label,
  options,
}: PortalCurrencySelectProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(options[0] ?? "USD");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedCurrency = window.localStorage.getItem(portalCurrencyStorageKey);

    if (storedCurrency && options.includes(storedCurrency)) {
      setSelectedCurrency(storedCurrency);
    }
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

  return (
    <div ref={containerRef} className="relative">
      <button
        className={portalTheme.utilityLinkClass}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {selectedCurrency || label}
      </button>

      {open ? (
        <div className="absolute top-full z-40 mt-2 min-w-[112px] rounded-[12px] border border-[rgba(104,123,158,0.18)] bg-[linear-gradient(180deg,rgba(41,50,68,0.98)_0%,rgba(31,38,52,0.98)_100%)] p-2 shadow-[0_18px_32px_rgba(5,10,22,0.28)] backdrop-blur-xl">
          {options.map((option) => (
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
