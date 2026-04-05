import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function LicenseBillingPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);
  const t = await getTranslations("Dashboard");

  return (
    <DashboardShell
      currentPath="/dashboard/licenses"
      description={t("licenseBillingDescription")}
      locale={params.locale as AppLocale}
      title={t("licenseBillingTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <p className="dashboard-kicker">{t("licenseBillingKicker")}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
          {t("licenseBillingHeading")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6b7280]">
          {t("licenseBillingBody")}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="btn-primary"
            href={localePath(params.locale, "/dashboard/products")}
          >
            {t("licenseBillingPlansButton")}
          </Link>
          <Link
            className="btn-secondary"
            href={localePath(params.locale, "/dashboard/tenants")}
          >
            {t("licenseBillingTenantsButton")}
          </Link>
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <p className="dashboard-kicker">{t("licenseBillingOpsKicker")}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">
              {t("licenseBillingOpsPlansLabel")}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#0a1628]">
              {t("licenseBillingOpsPlansValue")}
            </p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">
              {t("licenseBillingOpsTenantsLabel")}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#0a1628]">
              {t("licenseBillingOpsTenantsValue")}
            </p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[#7b8794]">
              {t("licenseBillingOpsPaymentsLabel")}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#0a1628]">
              {t("licenseBillingOpsPaymentsValue")}
            </p>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
