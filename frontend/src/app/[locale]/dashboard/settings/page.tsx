import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { type AppLocale } from "@/i18n/routing";
import {
  getAuthenticatedUserFromCookies,
  isPlatformOwnerContext,
  localePath,
} from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  params: {
    locale: string;
  };
};

function MigrationIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path d="M4 7.5h9.5A3.5 3.5 0 0 1 17 11v0a3.5 3.5 0 0 1-3.5 3.5H7" />
      <path d="m10 11 3.5 3.5L10 18" />
      <path d="M5 4h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 4Z" />
    </svg>
  );
}

export default async function SettingsPage({
  params,
}: Readonly<SettingsPageProps>) {
  setRequestLocale(params.locale);
  const copy = tenantAdminCopy(params.locale);
  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);
  const isPlatformOwner = isPlatformOwnerContext(user);
  const hasTenantSettingsContext = !isPlatformOwner;

  const cards = [
    {
      key: "products",
      title: "Products/Services",
      description: "Manage hosting products, pricing, package settings, and product groups.",
      href: localePath(params.locale, "/dashboard/products"),
    },
    {
      key: "addons",
      title: "Product Addons",
      description: "Create and manage recurring or one-time add-ons attached to hosting products.",
      href: localePath(params.locale, "/dashboard/product-addons"),
    },
    {
      key: "servers",
      title: "Servers",
      description: "Configure provisioning servers, package mappings, and panel connectivity.",
      href: localePath(params.locale, "/dashboard/servers"),
    },
    {
      key: "branding",
      title: copy.settings.brandingTitle,
      description: copy.settings.brandingDescription,
      href: localePath(params.locale, "/dashboard/settings/branding"),
    },
    {
      key: "surface",
      title: copy.settings.surfaceTitle,
      description: copy.settings.surfaceDescription,
      href: localePath(params.locale, "/dashboard/settings/portal"),
    },
    {
      key: "content",
      title: copy.settings.contentTitle,
      description: copy.settings.contentDescription,
      href: localePath(params.locale, "/dashboard/content"),
    },
    {
      key: "payments",
      title: copy.settings.paymentGatewaysTitle,
      description: copy.settings.paymentGatewaysDescription,
      href: localePath(params.locale, "/dashboard/settings/payments"),
    },
  ];

  const migrationHref = localePath(params.locale, "/dashboard/settings/import/whmcs");

  if (isPlatformOwner) {
    return (
      <DashboardShell
        currentPath="/dashboard/settings"
        description={copy.settings.platformDescription}
        locale={params.locale as AppLocale}
        title={copy.settings.platformTitle}
      >
        <section className="glass-card p-6 md:p-8">
          <p className="dashboard-kicker">{copy.settings.platformKicker}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
            {copy.settings.platformHeading}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#6b7280]">
            {copy.settings.platformNote}
          </p>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <article className="glass-card p-6 md:p-8">
            <p className="dashboard-kicker">
              {copy.settings.platformCardKicker}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
              {copy.settings.platformPlansTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              {copy.settings.platformPlansDescription}
            </p>
            <div className="mt-6">
              <Link
                className="btn-primary"
                href={localePath(params.locale, "/dashboard/plans")}
              >
                {copy.settings.platformPlansCta}
              </Link>
            </div>
          </article>

          <article className="glass-card p-6 md:p-8">
            <p className="dashboard-kicker">
              {copy.settings.platformCardKicker}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
              {copy.settings.platformTenantsTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              {copy.settings.platformTenantsDescription}
            </p>
            <div className="mt-6">
              <Link
                className="btn-primary"
                href={localePath(params.locale, "/dashboard/tenants")}
              >
                {copy.settings.platformTenantsCta}
              </Link>
            </div>
          </article>

          <article className="glass-card p-6 md:p-8">
            <p className="dashboard-kicker">
              {copy.settings.platformCardKicker}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
              {copy.settings.platformBillingTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              {copy.settings.platformBillingDescription}
            </p>
            <div className="mt-6">
              <Link
                className="btn-secondary"
                href={localePath(params.locale, "/dashboard/licenses")}
              >
                {copy.settings.platformBillingCta}
              </Link>
            </div>
          </article>

          <article className="glass-card p-6 md:p-8">
            <p className="dashboard-kicker">
              {copy.settings.platformCardKicker}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
              {copy.security.securityCardTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              {copy.security.securityCardDescription}
            </p>
            <div className="mt-6">
              <Link
                className="btn-primary"
                href={localePath(params.locale, "/dashboard/settings/security")}
              >
                {copy.security.securityCardCta}
              </Link>
            </div>
          </article>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      currentPath="/dashboard/settings"
      description={copy.settings.description}
      locale={params.locale as AppLocale}
      title={copy.settings.title}
    >
      {hasTenantSettingsContext ? (
        <section className="grid gap-4">
          <div>
            <p className="dashboard-kicker">Settings</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
              Import & Migration
            </h2>
          </div>

          <article className="glass-card p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dbeafe] bg-[#eff6ff] text-[#036deb]">
                  <MigrationIcon />
                </span>
                <div className="min-w-0">
                  <p className="dashboard-kicker">Import & Migration</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
                    WHMCS Migration
                  </h3>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b7280]">
                    Import clients, products, and services from an existing WHMCS installation.
                  </p>
                </div>
              </div>

              <div className="shrink-0 md:pt-1">
                <Link className="btn-primary whitespace-nowrap" href={migrationHref}>
                  Start Migration
                </Link>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.key} className="glass-card p-6 md:p-8">
            <p className="dashboard-kicker">{copy.settings.openModule}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
              {card.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              {card.description}
            </p>
            <div className="mt-6">
              <Link className="btn-primary" href={card.href}>
                {copy.settings.openModule}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="glass-card p-6 md:p-8">
        <p className="dashboard-kicker">{copy.settings.title}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={`${card.key}-summary`}
              className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-4 text-sm font-medium text-[#33506f]"
            >
              <p className="font-semibold text-[#0a1628]">{card.title}</p>
              <p className="mt-2 text-[#5f7389]">{card.description}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
