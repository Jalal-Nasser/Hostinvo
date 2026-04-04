"use client";

import { useRouter } from "next/navigation";

import { routing } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

type PortalLocaleSelectProps = {
  currentLocale: string;
  currentPath: string;
  label: string;
};

const localeLabels: Record<string, string> = {
  en: "English",
  ar: "العربية",
};

export function PortalLocaleSelect({
  currentLocale,
  currentPath,
  label,
}: PortalLocaleSelectProps) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-[12px] text-[#94a8cd]">
      <span>{label}</span>
      <select
        aria-label={label}
        className="min-h-9 rounded-[10px] border border-[rgba(104,123,158,0.16)] bg-[rgba(255,255,255,0.04)] ps-3 pe-8 text-[12px] font-medium text-[#e0e8f8] outline-none transition hover:border-[rgba(104,123,158,0.24)] focus:border-[rgba(88,145,255,0.38)]"
        defaultValue={currentLocale}
        onChange={(event) => {
          router.push(localePath(event.target.value, currentPath));
        }}
      >
        {routing.locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeLabels[locale] ?? locale.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
