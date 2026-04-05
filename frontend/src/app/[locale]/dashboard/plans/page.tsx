import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PlanEditor } from "@/components/platform-owner/plan-editor";
import { type AppLocale } from "@/i18n/routing";
import { fetchPlatformPlansFromCookies } from "@/lib/platform-plans";
import { fetchPublicPlans } from "@/lib/public-plans";

export const dynamic = "force-dynamic";

type PlansPageProps = {
  params: {
    locale: string;
  };
};

export default async function PlansPage({ params }: Readonly<PlansPageProps>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const t = await getTranslations("Dashboard");
  const cookieHeader = cookies().toString();
  const payload = await fetchPlatformPlansFromCookies(cookieHeader);
  const fallbackPublic = payload ? null : await fetchPublicPlans();
  const fallback = payload ?? {
    pricing_note: fallbackPublic?.pricing_note ?? null,
    plans: fallbackPublic?.plans ?? [],
  };

  return (
    <DashboardShell
      currentPath="/dashboard/plans"
      locale={locale}
      description={t("plansDescription")}
      title={t("plansTitle")}
    >
      <PlanEditor initial={fallback} />
    </DashboardShell>
  );
}
