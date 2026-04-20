import Link from "next/link";
import type { ReactNode } from "react";

import { PortalCartLink } from "@/components/portal/portal-cart-link";
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
    "inline-flex min-h-[36px] items-center gap-1.5 px-3 text-[12px] font-semibold text-[#f3f7ff] transition hover:text-white";

  return (
    <div className="w-full border-b border-[rgba(255,255,255,0.06)] bg-[linear-gradient(90deg,#515c74_0%,#465066_46%,#3e475e_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex min-h-[38px] w-full items-center ps-3 pe-3 md:ps-5 md:pe-5 lg:ps-6 lg:pe-6">
        <div className="ms-auto flex items-center text-[#f3f7ff]">
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
            className={joinClasses(actionClass, "px-3")}
            href={localePath(locale, "/portal/cart")}
            label={locale === "ar" ? "عرض السلة" : "View Cart"}
            prefix={
              <TopbarIcon>
                <CartIcon />
              </TopbarIcon>
            }
          />

          <span className="h-3 w-px bg-[rgba(255,255,255,0.12)]" />

          <div className={joinClasses(actionClass, "px-3")}>
            <PortalCurrencySelect
              className="text-[12px] font-semibold text-[#f3f7ff] hover:text-white"
              label={locale === "ar" ? "العملة" : "Currency"}
              options={[defaultCurrency]}
            />
            <ChevronDown />
          </div>

          <span className="h-3 w-px bg-[rgba(255,255,255,0.12)]" />

          <Link
            className={joinClasses(actionClass, "px-3")}
            href={localePath(locale, "/portal/account")}
          >
            <TopbarIcon>
              <UserIcon />
            </TopbarIcon>
            <span>{locale === "ar" ? "حسابي" : "My Account"}</span>
            <ChevronDown />
          </Link>
        </div>
      </div>
    </div>
  );
}
