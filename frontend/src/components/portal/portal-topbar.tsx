import Link from "next/link";

import { PortalCartLink } from "@/components/portal/portal-cart-link";
import { PortalCurrencySelect } from "@/components/portal/portal-currency-select";
import { PortalLogoutButton } from "@/components/portal/portal-logout-button";
import { portalTheme } from "@/components/portal/portal-theme";
import type { AuthenticatedUser } from "@/lib/auth";
import { localePath } from "@/lib/auth";

type PortalTopbarProps = {
  locale: string;
  user: AuthenticatedUser;
  t: (key: string) => string;
};

export function PortalTopbar({ locale, user, t }: PortalTopbarProps) {
  return (
    <div className={[portalTheme.utilityStripClass, "mb-5 flex min-h-[40px] items-center ps-4 pe-4 py-2"].join(" ")}>
      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <span className="rounded-full border border-[rgba(104,123,158,0.18)] bg-[rgba(255,255,255,0.04)] ps-2.5 pe-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c3d2ee]">
          {user.tenant?.name ?? t("overviewTitle")}
        </span>
      </div>

      <div className="ms-auto flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.14em]">
        <PortalCartLink
          className={portalTheme.utilityLinkClass}
          href={localePath(locale, "/portal/cart")}
          label={t("topbarViewCart")}
        />
        <span className="h-3 w-px bg-[rgba(104,123,158,0.2)]" />
        <PortalCurrencySelect label={t("topbarCurrency")} options={["USD", "SAR", "EUR"]} />
        <span className="h-3 w-px bg-[rgba(104,123,158,0.2)]" />
        <Link className={portalTheme.utilityLinkClass} href={localePath(locale, "/portal/account")}>
          {t("topbarMyAccount")}
        </Link>
        <span className="h-3 w-px bg-[rgba(104,123,158,0.2)]" />
        <PortalLogoutButton />
      </div>
    </div>
  );
}
