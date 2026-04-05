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

type TenantImpersonationActionsProps = {
  tenantId: string;
  locale: string;
};

export function TenantImpersonationActions({
  tenantId,
  locale,
}: TenantImpersonationActionsProps) {
  const t = useTranslations("Tenants");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleImpersonation(mode: "admin" | "portal") {
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
    <section className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <p className="dashboard-kicker">{t("impersonationTitle")}</p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
          {t("impersonationHeading")}
        </h2>
        <p className="text-sm leading-7 text-[#6b7280]">
          {t("impersonationDescription")}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button disabled={isPending} onClick={() => handleImpersonation("admin")}>
          {t("impersonateAdminButton")}
        </Button>
        <Button
          disabled={isPending}
          onClick={() => handleImpersonation("portal")}
          variant="outline"
        >
          {t("impersonatePortalButton")}
        </Button>
      </div>

      {message ? <div className="mt-4"><StatusBanner message={message} tone="success" /></div> : null}
      {error ? <div className="mt-4"><StatusBanner message={error} tone="error" /></div> : null}
    </section>
  );
}
