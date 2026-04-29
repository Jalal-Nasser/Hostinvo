"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { localePath } from "@/lib/auth";
import { switchTenantContext } from "@/lib/tenants";

type TenantRowActionsProps = {
  tenantId: string;
  locale: string;
};

export function TenantRowActions({
  tenantId,
  locale,
}: TenantRowActionsProps) {
  const t = useTranslations("Tenants");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openWorkspace(mode: "admin" | "portal") {
    setError(null);

    startTransition(async () => {
      const result = await switchTenantContext(tenantId);

      if (result.error) {
        setError(result.error ?? t("serviceUnavailable"));
        return;
      }

      router.push(mode === "admin" ? localePath(locale, "/dashboard") : localePath(locale, "/portal"));
      router.refresh();
    });
  }

  return (
    <div className="tenant-row-actions">
      <div className="tenant-row-action-buttons">
        <button
          aria-label={t("editTenantTitle")}
          className="tenant-row-icon-button"
          disabled={isPending}
          onClick={() => router.push(localePath(locale, `/dashboard/tenants/${tenantId}`))}
          title={t("editTenantTitle")}
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M16.9 4.6l2.5 2.5m-1.1-3.9a1.8 1.8 0 012.5 2.5L8 18.5 3.5 20l1.5-4.5L17.8 2.7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        </button>
        <button
          aria-label={t("viewTenantButton")}
          className="tenant-row-icon-button"
          disabled={isPending}
          onClick={() => router.push(localePath(locale, `/dashboard/tenants/${tenantId}`))}
          title={t("viewTenantButton")}
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        </button>
        <button
          aria-label={t("openTenantDashboardButton")}
          className="tenant-row-icon-button"
          disabled={isPending}
          onClick={() => openWorkspace("admin")}
          title={t("openTenantDashboardButton")}
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 5.5h14A1.5 1.5 0 0120.5 7v8A1.5 1.5 0 0119 16.5H5A1.5 1.5 0 013.5 15V7A1.5 1.5 0 015 5.5zm4 15h6m-3-4v4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        </button>
        <button
          aria-label={t("impersonatePortalButton")}
          className="tenant-row-icon-button"
          disabled={isPending}
          onClick={() => openWorkspace("portal")}
          title={t("impersonatePortalButton")}
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15.5 19a4.5 4.5 0 00-9 0M11 11a3 3 0 100-6 3 3 0 000 6zm6-4v6m3-3h-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        </button>
      </div>
      {error ? <StatusBanner message={error} tone="error" /> : null}
    </div>
  );
}
