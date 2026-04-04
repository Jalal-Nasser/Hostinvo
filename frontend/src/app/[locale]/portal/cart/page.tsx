import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { PortalCartClient } from "@/components/portal/portal-cart-client";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalCartPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Portal");

  return (
    <PortalShell
      currentPath="/portal/cart"
      description={t("cartPageDescription")}
      locale={params.locale as AppLocale}
      title={t("cartPageTitle")}
    >
      <PortalCartClient
        addedAtLabel={t("cartAddedAtLabel")}
        cartDescription={t("cartPanelDescription")}
        cartKicker={t("cartPanelKicker")}
        cartTitle={t("cartPanelTitle")}
        clearCartLabel={t("cartClearButton")}
        comparePricingLabel={t("quickActionDomainPricing")}
        continueShoppingLabel={t("registerDomainButton")}
        emptyDescription={t("cartEmptyDescription")}
        emptyTitle={t("cartEmptyTitle")}
        itemTypeLabel={t("cartItemTypeDomain")}
        mockCheckoutNote={t("cartCheckoutNote")}
        pricingHref={localePath(params.locale, "/portal/domains/pricing")}
        registerHref={localePath(params.locale, "/portal/domains/register")}
        removeLabel={t("cartRemoveButton")}
      />
    </PortalShell>
  );
}
