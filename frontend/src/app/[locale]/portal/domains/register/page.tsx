import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { DomainRegisterFlow } from "@/components/portal/domain-register-flow";
import { type AppLocale } from "@/i18n/routing";

export default async function PortalRegisterDomainPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { query?: string; tld?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");

  return (
    <PortalShell
      currentPath="/portal/domains/register"
      description={t("registerPageDescription")}
      locale={params.locale as AppLocale}
      title={t("registerPageTitle")}
    >
      <DomainRegisterFlow
        initialQuery={searchParams?.query}
        initialTld={searchParams?.tld}
        labels={{
          sectionKicker: t("registerSectionKicker"),
          formTitle: t("registerFlowTitle"),
          formDescription: t("registerFlowDescription"),
          domainInputLabel: t("registerDomainInputLabel"),
          domainInputPlaceholder: t("registerDomainInputPlaceholder"),
          suggestedTldsLabel: t("registerSuggestedTldsLabel"),
          submitButton: t("registerSubmitButton"),
          submittingButton: t("registerSubmittingButton"),
          infoNote: t("registerInfoNote"),
          requestPreviewLabel: t("registerRequestPreviewLabel"),
          requestPreviewDescription: t("registerRequestPreviewDescription"),
          errorMessage: t("registerErrorMessage"),
        }}
        locale={params.locale}
      />
    </PortalShell>
  );
}
