import { setRequestLocale } from "next-intl/server";
import { ProviderOnboardingWizard } from "@/components/onboarding/provider-onboarding-wizard";
import { type AppLocale } from "@/i18n/routing";

export default async function OnboardingPage({
  params,
}: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  return <ProviderOnboardingWizard locale={locale} />;
}
