import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { DomainHero } from "@/components/portal/domain-hero";
import { PortalNewsCard } from "@/components/portal/portal-news-card";
import { QuickActions } from "@/components/portal/quick-actions";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Portal");
  const isRtl = params.locale === "ar";

  return (
    <PortalShell
      currentPath="/portal"
      description={t("overviewDescription")}
      locale={params.locale as AppLocale}
      showPageIntro={false}
      title={t("overviewTitle")}
    >
      <DomainHero
        description={t("heroDescription")}
        isRtl={isRtl}
        kicker={t("heroKicker")}
        placeholder={t("heroPlaceholder")}
        registerHref={localePath(params.locale, "/portal/domains/register")}
        searchLabel={t("heroSearchButton")}
        suggestedExtensionsLabel={t("heroSuggestedExtensions")}
        title={t("heroTitle")}
        transferHref={localePath(params.locale, "/portal/domains/transfer")}
        transferLabel={t("heroTransferButton")}
      />

      <div id="products" className="scroll-mt-6" />
      <QuickActions
        kicker={t("quickActionsKicker")}
        title={t("quickActionsTitle")}
        actions={[
          {
            key: "buy-domain",
            label: t("quickActionBuyDomain"),
            description: t("quickActionBuyDomainDescription"),
            href: localePath(params.locale, "/portal/domains/register"),
            icon: "buy-domain",
          },
          {
            key: "transfer-domain",
            label: t("quickActionTransferDomain"),
            description: t("quickActionTransferDomainDescription"),
            href: localePath(params.locale, "/portal/domains/transfer"),
            icon: "transfer-domain",
          },
          {
            key: "domain-pricing",
            label: t("quickActionDomainPricing"),
            description: t("quickActionDomainPricingDescription"),
            href: localePath(params.locale, "/portal/domains/pricing"),
            icon: "domain-pricing",
          },
          {
            key: "get-support",
            label: t("quickActionGetSupport"),
            description: t("quickActionGetSupportDescription"),
            href: localePath(params.locale, "/portal/tickets/new"),
            icon: "get-support",
          },
        ]}
      />

      <div id="website-security" className="scroll-mt-6" />
      <div id="network-status" className="scroll-mt-6" />
      <div id="knowledgebase" className="scroll-mt-6" />
      <PortalNewsCard
        description={t("newsDescription")}
        emptyDescription={t("newsEmptyDescription")}
        emptyTitle={t("newsEmptyTitle")}
        kicker={t("newsKicker")}
        title={t("newsTitle")}
      />
    </PortalShell>
  );
}
