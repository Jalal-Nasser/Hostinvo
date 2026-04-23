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

export default async function SettingsPage({
  params,
}: Readonly<SettingsPageProps>) {
  setRequestLocale(params.locale);
  const copy = tenantAdminCopy(params.locale);
  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);
  const isPlatformOwner = isPlatformOwnerContext(user);

  const cards = [
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
