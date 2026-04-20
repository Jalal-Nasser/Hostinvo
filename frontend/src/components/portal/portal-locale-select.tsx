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
    <label className="flex items-center gap-2 text-[12px] text-[#dce5f8]">
      {label ? <span>{label}</span> : null}
      <select
        aria-label={label || "Language"}
        className="min-h-8 rounded-[2px] border-0 bg-transparent ps-0 pe-6 text-[12px] font-medium text-[#dce5f8] outline-none"
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
