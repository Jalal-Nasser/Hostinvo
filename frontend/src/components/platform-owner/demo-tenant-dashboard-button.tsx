"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { localePath } from "@/lib/auth";
import { startDemoTenantContext } from "@/lib/tenants";

type DemoTenantDashboardButtonProps = {
  locale: string;
  iconOnly?: boolean;
};

export function DemoTenantDashboardButton({
  locale,
  iconOnly = false,
}: DemoTenantDashboardButtonProps) {
  const t = useTranslations("Workspace");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setError(null);

    startTransition(async () => {
      const result = await startDemoTenantContext();

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push(localePath(locale, "/dashboard"));
      router.refresh();
    });
  }

  if (iconOnly) {
    return (
      <div className="relative">
        <button
          aria-label={t("openDemoTenantDashboard")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dbeafe] bg-[#eff6ff] text-[#036deb] transition hover:bg-[#dbeafe] disabled:pointer-events-none disabled:opacity-60"
          disabled={isPending}
          onClick={handleOpen}
          title={t("openDemoTenantDashboard")}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 7.5A1.5 1.5 0 015.5 6h13A1.5 1.5 0 0120 7.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 16.5v-9zm4.5 3h7m-7 3h4M8 3.5h8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </button>
        {error ? (
          <div className="mt-2">
            <StatusBanner message={error} tone="error" />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-2.5">
      <button
        className="inline-flex w-full items-center justify-center rounded-md border border-[#c7dcfd] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#036deb] transition hover:bg-[#f5f9ff] disabled:pointer-events-none disabled:opacity-60"
        disabled={isPending}
        onClick={handleOpen}
        type="button"
      >
        {isPending ? t("openingDemoTenantDashboard") : t("openDemoTenantDashboard")}
      </button>
      {error ? (
        <div className="mt-2">
          <StatusBanner message={error} tone="error" />
        </div>
      ) : null}
    </div>
  );
}
