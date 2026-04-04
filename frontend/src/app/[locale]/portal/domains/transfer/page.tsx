import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { DomainTransferFlow } from "@/components/portal/domain-transfer-flow";
import { type AppLocale } from "@/i18n/routing";

export default async function PortalTransferDomainPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { query?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");

  return (
    <PortalShell
      currentPath="/portal/domains/transfer"
      description={t("transferPageDescription")}
      locale={params.locale as AppLocale}
      title={t("transferPageTitle")}
    >
      <DomainTransferFlow
        initialQuery={searchParams?.query}
        locale={params.locale}
        labels={{
          sectionKicker: t("transferSectionKicker"),
          formTitle: t("transferFlowTitle"),
          formDescription: t("transferFlowDescription"),
          domainInputLabel: t("transferDomainInputLabel"),
          domainInputPlaceholder: t("transferDomainInputPlaceholder"),
          authCodeLabel: t("transferAuthCodeLabel"),
          authCodePlaceholder: t("transferAuthCodePlaceholder"),
          continueButton: t("transferContinueButton"),
          submittingButton: t("transferSubmittingButton"),
          infoNote: t("transferInfoNote"),
          requestSummaryTitle: t("transferRequestSummaryTitle"),
          requestSummaryDescription: t("transferRequestSummaryDescription"),
          errorMessage: t("transferErrorMessage"),
        }}
      />
    </PortalShell>
  );
}
