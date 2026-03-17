import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OrderReview } from "@/components/orders/order-review";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export default async function OrderCheckoutReviewPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Orders");

  return (
    <DashboardShell
      actions={
        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, "/dashboard/orders/new")}
        >
          {t("backToCreateButton")}
        </Link>
      }
      currentPath="/dashboard/orders/checkout-review"
      description={t("reviewDescription")}
      locale={params.locale as AppLocale}
      title={t("reviewTitle")}
    >
      <OrderReview />
    </DashboardShell>
  );
}
