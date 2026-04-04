import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { DomainPricingTable } from "@/components/portal/domain-pricing-table";
import { type AppLocale } from "@/i18n/routing";

export default async function PortalDomainPricingPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");

  return (
    <PortalShell
      currentPath="/portal/domains/pricing"
      description={t("pricingPageDescription")}
      locale={params.locale as AppLocale}
      title={t("pricingPageTitle")}
    >
      <DomainPricingTable
        description={t("pricingTableDescription")}
        extensionLabel={t("pricingExtensionLabel")}
        kicker={t("pricingSectionKicker")}
        note={t("pricingInfoNote")}
        registerLabel={t("pricingRegisterLabel")}
        renewLabel={t("pricingRenewLabel")}
        rows={[
          { extension: ".com", register: "$12.99", transfer: "$11.49", renew: "$13.99" },
          { extension: ".net", register: "$10.99", transfer: "$10.49", renew: "$11.99" },
          { extension: ".org", register: "$9.49", transfer: "$9.49", renew: "$10.49" },
          { extension: ".sa", register: "$34.00", transfer: "$32.00", renew: "$34.00" },
        ]}
        title={t("pricingTableTitle")}
        transferLabel={t("pricingTransferLabel")}
      />
    </PortalShell>
  );
}
