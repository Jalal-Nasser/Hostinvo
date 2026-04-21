import Link from "next/link";
import type { ReactNode } from "react";

import { PortalCartLink } from "@/components/portal/portal-cart-link";
import { PortalAccountMenu } from "@/components/portal/portal-account-menu";
import { PortalCurrencySelect } from "@/components/portal/portal-currency-select";
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

function joinClasses(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

function TopbarIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-3.5 w-3.5 items-center justify-center text-[#e5edff]">
      {children}
    </span>
  );
}

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 5h2l1.5 8.5a1 1 0 0 0 1 .8h7.9a1 1 0 0 0 1-.76L19 8H7.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="10" cy="18" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M16 18a4 4 0 0 0-8 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      aria-hidden="true"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="m6 9 6 6 6-6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function PortalTopbar({ locale, user, branding }: PortalTopbarProps) {
  const defaultCurrency =
    branding?.default_currency?.trim().toUpperCase() || "USD";
  const activeTenant = user.active_tenant ?? user.tenant ?? null;
  const hasTenantContextReturn =
    user.roles.some((role) => role.name === "super_admin") && Boolean(activeTenant);
  const actionClass =
    "inline-flex items-center gap-2 text-[12px] font-semibold text-[#eef5ff] transition hover:text-white";

  return (
    <div className="w-full border-b border-[rgba(255,255,255,0.08)] bg-[linear-gradient(90deg,#2a3046_0%,#303b56_40%,#22314f_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="mx-auto flex min-h-[56px] w-full max-w-7xl items-center px-4 md:px-6 lg:px-8">
        <div className="ms-auto flex items-center gap-4 text-[#eef5ff]">
          {hasTenantContextReturn ? (
            <>
              <ImpersonationReturn
                className="inline-flex h-8 w-8 items-center justify-center text-[#dce6fa] transition hover:text-white"
                iconOnly
                locale={locale}
                variant="outline"
              />
              <span className="h-3 w-px bg-[rgba(255,255,255,0.12)]" />
            </>
          ) : null}

          <PortalCartLink
            className={joinClasses(actionClass, "px-2")}
            href={localePath(locale, "/portal/cart")}
            label={locale === "ar" ? "عرض السلة" : "View Cart"}
            prefix={
              <TopbarIcon>
                <CartIcon />
              </TopbarIcon>
            }
          />

          <span className="h-6 w-px rounded-full bg-[rgba(255,255,255,0.12)]" />

          <div className={joinClasses(actionClass, "px-2")}>            
            <PortalCurrencySelect
              className="text-[12px] font-semibold text-[#eef5ff] hover:text-white"
              label={locale === "ar" ? "العملة" : "USD"}
              options={
                defaultCurrency
                  ? [defaultCurrency, ...["USD", "SAR", "EUR"].filter((c) => c !== defaultCurrency)]
                  : ["USD", "SAR", "EUR"]
              }
              showChevron
            />
          </div>

          <span className="h-6 w-px rounded-full bg-[rgba(255,255,255,0.12)]" />

          <PortalAccountMenu
            locale={locale}
            label={locale === "ar" ? "حسابي" : "My Account"}
            buttonClass={joinClasses(actionClass, "px-2")}
          />
        </div>
      </div>
    </div>
  );
}
