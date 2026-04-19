import Link from "next/link";

import { PortalCartLink } from "@/components/portal/portal-cart-link";
import { PortalCurrencySelect } from "@/components/portal/portal-currency-select";
import { PortalLogoutButton } from "@/components/portal/portal-logout-button";
import { portalTheme } from "@/components/portal/portal-theme";
import { ImpersonationReturn } from "@/components/platform-owner/impersonation-return";
import type { AuthenticatedUser } from "@/lib/auth";
import { localePath } from "@/lib/auth";
import type { TenantBrandingRecord } from "@/lib/tenant-admin";

type PortalTopbarProps = {
  locale: string;
  user: AuthenticatedUser;
  t: (key: string) => string;
  branding?: TenantBrandingRecord | null;
};

function userInitials(user: AuthenticatedUser): string {
  const source = user.name || user.email || "";
  const initials = source
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "U";
}

export function PortalTopbar({ locale, user, t, branding }: PortalTopbarProps) {
  const defaultCurrency =
    branding?.default_currency?.trim().toUpperCase() || "USD";
  const activeTenant = user.active_tenant ?? user.tenant ?? null;
  const hasTenantContextReturn =
    user.roles.some((role) => role.name === "super_admin") && Boolean(activeTenant);
  const portalLabel =
    branding?.portal_name || activeTenant?.name || t("overviewTitle");

  return (
    <div
      className={[
        portalTheme.utilityStripClass,
        "mb-5 flex min-h-[48px] items-center gap-3 px-3 py-2",
      ].join(" ")}
    >
      {/* Left: workspace chip */}
      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#cdd7ed]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          {portalLabel}
        </span>
      </div>

      {/* Right: utility actions */}
      <div className="ms-auto flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em]">
        {hasTenantContextReturn ? (
          <ImpersonationReturn locale={locale} variant="outline" />
        ) : null}
        <PortalCartLink
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#cdd7ed] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
          href={localePath(locale, "/portal/cart")}
          label={t("topbarViewCart")}
        />
        <span className="h-4 w-px bg-[rgba(148,163,184,0.2)]" />
        <PortalCurrencySelect
          label={t("topbarCurrency")}
          options={[defaultCurrency]}
        />
        <span className="h-4 w-px bg-[rgba(148,163,184,0.2)]" />
        <Link
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-semibold tracking-[0.14em] text-[#cdd7ed] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
          href={localePath(locale, "/portal/account")}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] text-[10px] font-bold text-white">
            {userInitials(user)}
          </span>
          <span>{t("topbarMyAccount")}</span>
        </Link>
        <span className="h-4 w-px bg-[rgba(148,163,184,0.2)]" />
        <PortalLogoutButton />
      </div>
    </div>
  );
}
