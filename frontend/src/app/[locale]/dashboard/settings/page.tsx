import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { type CSSProperties } from "react";

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

type SettingsCardIcon = "box" | "addon" | "server" | "brand" | "portal" | "content" | "payment" | "migration";

type SettingsCard = {
  key: string;
  title: string;
  description: string;
  href: string;
  kicker?: string;
  cta?: string;
  accent: string;
  glow: string;
  icon: SettingsCardIcon;
};

function SettingsIcon({ icon }: { icon: SettingsCardIcon }) {
  const common = {
    className: "h-5 w-5",
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.75,
    viewBox: "0 0 24 24",
  };

  switch (icon) {
    case "box":
      return (
        <svg {...common}>
          <path d="M7 7.5 12 4l5 3.5M7 7.5v6L12 17l5-3.5v-6M7 7.5 12 11l5-3.5" />
        </svg>
      );
    case "addon":
      return (
        <svg {...common}>
          <path d="M7 7h10v10H7zM4 12h3m10 0h3M12 4v3m0 10v3" />
        </svg>
      );
    case "server":
      return (
        <svg {...common}>
          <path d="M5.5 6h13A1.5 1.5 0 0 1 20 7.5v3A1.5 1.5 0 0 1 18.5 12h-13A1.5 1.5 0 0 1 4 10.5v-3A1.5 1.5 0 0 1 5.5 6Zm0 6h13A1.5 1.5 0 0 1 20 13.5v3a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-3A1.5 1.5 0 0 1 5.5 12ZM8 9h.01M8 15h.01" />
        </svg>
      );
    case "brand":
      return (
        <svg {...common}>
          <path d="M5 19 19 5M7 5h5m7 7v5M6 14l4 4m4-12 4 4" />
        </svg>
      );
    case "portal":
      return (
        <svg {...common}>
          <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11ZM4 9h16m-9 10V9" />
        </svg>
      );
    case "content":
      return (
        <svg {...common}>
          <path d="M7 5h10a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 17 19H7a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 7 5Zm2 4h6m-6 3h6m-6 3h3" />
        </svg>
      );
    case "payment":
      return (
        <svg {...common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Zm0 2.5h16m-4.5 4H17" />
        </svg>
      );
    case "migration":
      return (
        <svg {...common}>
          <path d="M4 7.5h9.5A3.5 3.5 0 0 1 17 11a3.5 3.5 0 0 1-3.5 3.5H7" />
          <path d="m10 11 3.5 3.5L10 18" />
          <path d="M5 4h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 4Z" />
        </svg>
      );
  }
}

function SettingsModuleCard({ card, defaultCta }: { card: SettingsCard; defaultCta: string }) {
  return (
    <article
      className="settings-module-card"
      style={{
        "--settings-card-accent": card.accent,
        "--settings-card-glow": card.glow,
      } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="settings-module-card-kicker">{card.kicker ?? "Open module"}</p>
          <h2 className="mt-3 text-[1.35rem] font-semibold tracking-[-0.035em] text-[#0a1628]">
            {card.title}
          </h2>
        </div>
        <span className="settings-module-card-icon">
          <SettingsIcon icon={card.icon} />
        </span>
      </div>
      <p className="mt-5 min-h-[3.75rem] text-sm leading-7 text-[#475467]">
        {card.description}
      </p>
      <div className="mt-6">
        <Link className="settings-module-card-action" href={card.href}>
          {card.cta ?? defaultCta}
        </Link>
      </div>
    </article>
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

  const cards: SettingsCard[] = [
    {
      key: "products",
      title: "Products/Services",
      description: "Manage hosting products, pricing, package settings, and product groups.",
      href: localePath(params.locale, "/dashboard/products"),
      accent: "#22c55e",
      glow: "rgba(34,197,94,0.18)",
      icon: "box",
    },
    {
      key: "addons",
      title: "Product Addons",
      description: "Create and manage recurring or one-time add-ons attached to hosting products.",
      href: localePath(params.locale, "/dashboard/product-addons"),
      accent: "#ec4899",
      glow: "rgba(236,72,153,0.18)",
      icon: "addon",
    },
    {
      key: "servers",
      title: "Servers",
      description: "Configure provisioning servers, package mappings, and panel connectivity.",
      href: localePath(params.locale, "/dashboard/servers"),
      accent: "#fb923c",
      glow: "rgba(251,146,60,0.18)",
      icon: "server",
    },
    {
      key: "branding",
      title: copy.settings.brandingTitle,
      description: copy.settings.brandingDescription,
      href: localePath(params.locale, "/dashboard/settings/branding"),
      accent: "#3b82f6",
      glow: "rgba(59,130,246,0.18)",
      icon: "brand",
    },
    {
      key: "surface",
      title: copy.settings.surfaceTitle,
      description: copy.settings.surfaceDescription,
      href: localePath(params.locale, "/dashboard/settings/portal"),
      accent: "#22d3ee",
      glow: "rgba(34,211,238,0.18)",
      icon: "portal",
    },
    {
      key: "content",
      title: copy.settings.contentTitle,
      description: copy.settings.contentDescription,
      href: localePath(params.locale, "/dashboard/content"),
      accent: "#8b5cf6",
      glow: "rgba(139,92,246,0.18)",
      icon: "content",
    },
    {
      key: "payments",
      title: copy.settings.paymentGatewaysTitle,
      description: copy.settings.paymentGatewaysDescription,
      href: localePath(params.locale, "/dashboard/settings/payments"),
      accent: "#14b8a6",
      glow: "rgba(20,184,166,0.18)",
      icon: "payment",
    },
  ];

  const migrationCard: SettingsCard = {
    key: "import-whmcs",
    title: "WHMCS Migration",
    description: "Import clients, products, and services from an existing WHMCS installation.",
    href: localePath(params.locale, "/dashboard/settings/import/whmcs"),
    kicker: "Import & Migration",
    cta: "Start Migration",
    accent: "#22d3ee",
    glow: "rgba(34,211,238,0.18)",
    icon: "migration",
  };
  const visibleCards = hasTenantSettingsContext ? [migrationCard, ...cards] : cards;

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
      <section className="grid gap-5 xl:grid-cols-3">
        {visibleCards.map((card) => (
          <SettingsModuleCard
            key={card.key}
            card={card}
            defaultCta={copy.settings.openModule}
          />
        ))}
      </section>

      <section className="glass-card p-6 md:p-8">
        <p className="dashboard-kicker">{copy.settings.title}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => (
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
