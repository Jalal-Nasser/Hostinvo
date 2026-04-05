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
};

export function ImpersonationReturn({ locale, variant = "outline" }: ImpersonationReturnProps) {
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

  return (
    <Button disabled={isPending} onClick={handleStop} variant={variant}>
      {t("returnToPlatformOwner")}
    </Button>
  );
}
