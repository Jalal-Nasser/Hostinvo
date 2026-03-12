import { setRequestLocale } from "next-intl/server";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ProviderOnboardingWizard } from "@/components/onboarding/provider-onboarding-wizard";
import { type AppLocale } from "@/i18n/routing";
import { getLaunchContent } from "@/lib/launch-content";

export default async function OnboardingPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);

  return (
    <MarketingShell
      currentPath="/onboarding"
      description={content.onboarding.description}
      locale={locale}
      title={content.onboarding.title}
    >
      <ProviderOnboardingWizard locale={locale} />
    </MarketingShell>
  );
}
