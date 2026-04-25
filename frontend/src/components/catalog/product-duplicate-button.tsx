"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { duplicateProduct } from "@/lib/catalog";
import { localePath } from "@/lib/auth";

type ProductDuplicateButtonProps = {
  productId: string;
};

export function ProductDuplicateButton({ productId }: ProductDuplicateButtonProps) {
  const t = useTranslations("Catalog");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDuplicate() {
    setError(null);

    startTransition(async () => {
      try {
        const product = await duplicateProduct(productId);
        router.push(localePath(locale, `/dashboard/products/${product.id}/edit`));
        router.refresh();
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : t("duplicateProductError"));
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
        {isPending ? t("duplicatingProductButton") : t("duplicateProductButton")}
      </button>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
