"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { localePath } from "@/lib/auth";
import { clearTenantContext } from "@/lib/tenants";

type ImpersonationReturnProps = {
  locale: string;
  variant?: "default" | "outline";
  className?: string;
  iconOnly?: boolean;
};

export function ImpersonationReturn({
  locale,
  variant = "outline",
  className,
  iconOnly = false,
}: ImpersonationReturnProps) {
  const t = useTranslations("Tenants");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStop() {
    startTransition(async () => {
      await clearTenantContext();

      router.push(localePath(locale, "/dashboard/tenants"));
      router.refresh();
    });
  }

  if (iconOnly) {
    return (
      <button
        aria-label={t("returnToPlatformOwner")}
        className={className}
        disabled={isPending}
        onClick={handleStop}
        title={t("returnToPlatformOwner")}
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
            d="M11 17l-5-5m0 0l5-5m-5 5h12"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </button>
    );
  }

  return (
    <Button
      aria-label={t("returnToPlatformOwner")}
      className={className}
      disabled={isPending}
      onClick={handleStop}
      title={t("returnToPlatformOwner")}
      variant={variant}
    >
      {t("returnToPlatformOwner")}
    </Button>
  );
}
