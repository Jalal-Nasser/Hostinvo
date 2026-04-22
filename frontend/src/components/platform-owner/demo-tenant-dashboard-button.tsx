"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { localePath } from "@/lib/auth";
import { startDemoTenantContext } from "@/lib/tenants";

type DemoTenantDashboardButtonProps = {
  locale: string;
};

export function DemoTenantDashboardButton({ locale }: DemoTenantDashboardButtonProps) {
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
