"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { Button } from "@/components/ui/button";
import { activateTenant, suspendTenant } from "@/lib/tenants";

type TenantStatusActionsProps = {
  tenantId: string;
  status: string;
};

export function TenantStatusActions({
  tenantId,
  status,
}: TenantStatusActionsProps) {
  const t = useTranslations("Tenants");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActive = status === "active";

  function runAction(action: "activate" | "suspend") {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result =
        action === "activate"
          ? await activateTenant(tenantId)
          : await suspendTenant(tenantId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(
        action === "activate"
          ? t("tenantActivatedSuccess")
          : t("tenantSuspendedSuccess"),
      );
      router.refresh();
    });
  }

  return (
    <section className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <p className="dashboard-kicker">{t("statusControlsTitle")}</p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
          {t("statusControlsHeading")}
        </h2>
        <p className="text-sm leading-7 text-[#6b7280]">
          {t("statusControlsDescription")}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#123055]">
          {isActive ? t("statusActive") : t("statusSuspended")}
        </span>

        <Button
          disabled={isPending || isActive}
          onClick={() => runAction("activate")}
        >
          {t("activateTenantButton")}
        </Button>

        <Button
          disabled={isPending || !isActive}
          onClick={() => runAction("suspend")}
          variant="outline"
        >
          {t("suspendTenantButton")}
        </Button>
      </div>

      {message ? <div className="mt-4"><StatusBanner message={message} tone="success" /></div> : null}
      {error ? <div className="mt-4"><StatusBanner message={error} tone="error" /></div> : null}
    </section>
  );
}
