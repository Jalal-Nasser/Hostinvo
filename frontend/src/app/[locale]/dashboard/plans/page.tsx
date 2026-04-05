import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";

export const dynamic = "force-dynamic";

type PlansPageProps = {
  params: {
    locale: string;
  };
};

export default async function PlansPage({ params }: Readonly<PlansPageProps>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);

  return (
    <DashboardShell
      currentPath="/dashboard/plans"
      description={content.sections.plansDescription}
      locale={locale}
      title={content.sections.plansTitle}
    >
      <section className="dashboard-shell-surface">
        <div className="inline-flex rounded-full border border-[rgba(4,141,254,0.18)] bg-[#e0f0ff] px-5 py-2 text-sm font-semibold text-[#0054c5]">
          {content.pricingNote}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          {content.plans.map((plan) => (
            <article
              key={plan.key}
              className={plan.featured ? "pricing-card-featured relative" : "pricing-card"}
            >
              {plan.featured ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#faf9f5] px-4 py-1 text-xs font-bold text-[#048dfe] shadow-md">
                  {content.mostPopular}
                </div>
              ) : null}
              <p
                className={`text-sm font-semibold uppercase tracking-widest ${plan.featured ? "text-[rgba(255,255,255,0.7)]" : "text-[#048dfe]"}`}
              >
                {plan.name}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span
                  className={`text-5xl font-extrabold ${plan.featured ? "text-white" : "text-[#0a1628]"}`}
                >
                  {plan.price}
                </span>
                {plan.key !== "free_trial" ? (
                  <span
                    className={`text-sm ${plan.featured ? "text-[rgba(255,255,255,0.6)]" : "text-[#7a95b5]"}`}
                  >
                    {content.perMonth}
                  </span>
                ) : null}
              </div>
              <p
                className={`mt-2 text-sm ${plan.featured ? "text-[rgba(255,255,255,0.75)]" : "text-[#4a5e7a]"}`}
              >
                {plan.description}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.limits.map((limit) => (
                  <li
                    key={limit}
                    className={`flex items-center gap-2 text-sm ${plan.featured ? "text-[rgba(255,255,255,0.85)]" : "text-[#4a5e7a]"}`}
                  >
                    <svg
                      className={`h-4 w-4 shrink-0 ${plan.featured ? "text-white" : "text-[#048dfe]"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {limit}
                  </li>
                ))}
              </ul>
              <Link
                href={localePath(locale, "/onboarding")}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${plan.featured ? "bg-[#faf9f5] text-[#048dfe] hover:bg-[#f0f7ff]" : "btn-primary justify-center"}`}
              >
                {plan.ctaLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
