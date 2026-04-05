"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { Button } from "@/components/ui/button";
import { localePath } from "@/lib/auth";
import {
  impersonateTenantAdmin,
  impersonateTenantPortal,
} from "@/lib/tenants";

type TenantImpersonationButtonsProps = {
  tenantId: string;
  locale: string;
  compact?: boolean;
};

export function TenantImpersonationButtons({
  tenantId,
  locale,
  compact = false,
}: TenantImpersonationButtonsProps) {
  const t = useTranslations("Tenants");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runImpersonation(mode: "admin" | "portal") {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result =
        mode === "admin"
          ? await impersonateTenantAdmin(tenantId)
          : await impersonateTenantPortal(tenantId);

      if (result.error || !result.data) {
        setError(result.error ?? t("serviceUnavailable"));
        return;
      }

      const targetPath =
        mode === "admin"
          ? localePath(locale, "/dashboard")
          : localePath(locale, "/portal");

      window.open(targetPath, "_blank", "noopener,noreferrer");
      setMessage(
        mode === "admin"
          ? t("impersonationAdminSuccess")
          : t("impersonationPortalSuccess"),
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={isPending}
          onClick={() => runImpersonation("admin")}
          size={compact ? "sm" : "default"}
        >
          {t("impersonateAdminButton")}
        </Button>
        <Button
          disabled={isPending}
          onClick={() => runImpersonation("portal")}
          variant="outline"
          size={compact ? "sm" : "default"}
        >
          {t("impersonatePortalButton")}
        </Button>
      </div>

      {message ? <StatusBanner message={message} tone="success" /> : null}
      {error ? <StatusBanner message={error} tone="error" /> : null}
    </div>
  );
}
