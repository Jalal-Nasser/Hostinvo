"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { localePath } from "@/lib/auth";
import { duplicateService } from "@/lib/provisioning";

type ServiceDuplicateButtonProps = {
  serviceId: string;
  redirectTo?: "details" | "edit";
};

export function ServiceDuplicateButton({ serviceId, redirectTo = "edit" }: ServiceDuplicateButtonProps) {
  const t = useTranslations("Provisioning");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDuplicate() {
    setError(null);

    startTransition(async () => {
      try {
        const service = await duplicateService(serviceId);
        const path = redirectTo === "details"
          ? `/dashboard/services/${service.id}`
          : `/dashboard/services/${service.id}/edit`;

        router.push(localePath(locale, path));
        router.refresh();
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : t("duplicateServiceError"));
      }
    });
  }

  return (
    <div className="grid gap-2">
      <button
        className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={handleDuplicate}
        type="button"
      >
        {isPending ? t("duplicatingServiceButton") : t("duplicateServiceButton")}
      </button>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
