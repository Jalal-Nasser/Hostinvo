import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { siCpanel, siLinux, siPlesk } from "simple-icons";

import { HeroWorkflow } from "@/components/home/hero-workflow";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath, portalUrl } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";
import { fetchPublicPlans } from "@/lib/public-plans";

type CompatibilityPlatform = {
  key: "cpanel" | "plesk" | "linux";
  label: string;
  description: string;
};

const portalDashboardLabel = new URL(portalUrl).host + "/dashboard";

function CompatibilityLogo({
  platform,
}: Readonly<{ platform: CompatibilityPlatform["key"] }>) {
  const icon =
    platform === "cpanel" ? siCpanel : platform === "plesk" ? siPlesk : siLinux;

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[#0C1326] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_24px_rgba(0,0,0,0.35)]">
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          role="img"
          aria-label={icon.title}
          fill={`#${icon.hex}`}
        >
          <path d={icon.path} />
        </svg>
      </div>
      <div className="text-xl font-semibold tracking-[-0.03em] text-white">
        {platform === "cpanel" ? "cPanel" : platform === "plesk" ? "Plesk" : "Linux"}
      </div>
    </div>
  );
}

export default async function LocaleHomePage({
  params,
}: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const publicPlans = await fetchPublicPlans();
  const pricingNote = publicPlans?.pricing_note || content.pricingNote;
  const maxClientsLabel = (max: number) =>
    locale === "ar" ? `حتى ${max} عميل` : `Up to ${max} clients`;
  const plans = content.plans.map((plan) => {
    const override = publicPlans?.plans.find((item) => item.key === plan.key);
    if (!override) {
      return plan;
    }

    const price =
      override.monthly_price === null || override.monthly_price === undefined
        ? plan.price
        : `$${override.monthly_price}`;

    const limits = override.features?.length ? [...override.features] : [...plan.limits];
    if (override.max_clients) {
      limits[0] = maxClientsLabel(override.max_clients);
    }

    return {
      ...plan,
      name: override.marketing_name || override.label || plan.name,
      price,
      description: override.description || plan.description,
      limits,
    };
  });
  const compatibility =
    locale === "ar"
      ? {
          label: "الميزات المتوافقة",
          title: "ابدأ على البيئة التي يعمل عليها فريقك بالفعل",
          description:
            "صمم Hostinvo لمزودي الخدمة الذين يديرون cPanel وPlesk وبنية استضافة مبنية على Linux من اليوم الأول.",
          platforms: [
            {
              key: "cpanel" as const,
              label: "cPanel / WHM",
              description:
                "هيئ حسابات الاستضافة المشتركة ونفذ عمليات دورة الحياة من خلال أتمتة cPanel المألوفة.",
            },
            {
              key: "plesk" as const,
              label: "Plesk",
              description:
                "اربط بيئات Plesk على Linux أو Windows مع إدارة خدمات قائمة على الخطط والباقات.",
            },
            {
              key: "linux" as const,
              label: "Linux",
              description:
                "شغل المنصة على بنية Linux للمزودين مع Docker والطوابير والخدمات الجاهزة للإنتاج.",
            },
          ] satisfies CompatibilityPlatform[],
        }
      : {
          label: "Compatible features",
          title: "Deploy on the stack your team already trusts",
          description:
            "Hostinvo is designed for providers running cPanel, Plesk, and Linux-based hosting infrastructure from day one.",
          platforms: [
            {
              key: "cpanel" as const,
              label: "cPanel / WHM",
              description:
                "Provision shared-hosting accounts and manage lifecycle actions through familiar cPanel automation.",
            },
            {
              key: "plesk" as const,
              label: "Plesk",
              description:
                "Connect Windows or Linux-ready Plesk environments with package-driven service orchestration.",
            },
            {
              key: "linux" as const,
              label: "Linux",
              description:
                "Run on Linux-based provider infrastructure with Docker, queue workers, and production-ready services.",
            },
          ] satisfies CompatibilityPlatform[],
        };

  return (
    <MarketingShell currentPath="/" locale={locale}>
      {/* ════════════ HERO ════════════ */}
      <section className="relative overflow-hidden bg-[#060B18]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 left-1/2 h-[680px] w-[1000px] -translate-x-1/2 rounded-full bg-[#048dfe] opacity-[0.18] blur-[140px]" />
          <div className="absolute bottom-0 right-0 h-[420px] w-[620px] rounded-full bg-[#0352c4] opacity-[0.18] blur-[110px]" />
          <div className="absolute bottom-0 left-0 h-[320px] w-[480px] rounded-full bg-[#036deb] opacity-[0.08] blur-[100px]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
          <div className="flex flex-col items-center text-center">
            <span className="section-label mb-6">{content.badge}</span>
            <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.08] tracking-[-0.04em] text-white md:text-6xl lg:text-7xl">
              {content.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#93A5C1] md:text-xl">
              {content.heroDescription}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={localePath(locale, "/onboarding")}
                className="btn-primary min-h-14 w-full justify-center gap-2.5 rounded-[1.1rem] px-8 text-base shadow-[0_8px_40px_rgba(4,141,254,0.55)] sm:w-auto sm:min-w-[208px] whitespace-nowrap"
              >
                {content.primaryCta}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href={localePath(locale, "/pricing")}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-[1.1rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.05)] px-8 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-[rgba(255,255,255,0.1)] sm:w-auto sm:min-w-[208px] whitespace-nowrap"
              >
                {content.secondaryCta}
              </Link>
            </div>
            <p className="mt-6 text-sm text-[#6A7B99]">{content.heroSubnote}</p>
          </div>

          {/* ── Automation workflow strip ── */}
          <HeroWorkflow steps={content.heroWorkflow} isRtl={locale === "ar"} />

          {/* Dashboard mockup */}
          <div className="relative mx-auto mt-16 w-full max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[rgba(12,19,38,0.7)] shadow-[0_40px_100px_rgba(0,0,0,0.55)] backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-[rgba(148,163,184,0.08)] bg-[rgba(0,0,0,0.3)] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <div className="mx-4 flex-1 rounded-md bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs text-[#7A8FAF]">
                  {portalDashboardLabel}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-0 divide-x divide-[rgba(148,163,184,0.08)] rtl:divide-x-reverse">
                <div className="col-span-1 bg-[rgba(8,14,32,0.8)] px-3 py-5">
                  <div className="mb-4 h-5 w-20 rounded bg-[rgba(4,141,254,0.3)]" />
                  {[70, 50, 80, 60, 45, 65].map((w, i) => (
                    <div key={i} className="mt-3 flex items-center gap-2">
                      <div className="h-3 w-3 rounded bg-[rgba(4,141,254,0.3)]" />
                      <div
                        className="h-2.5 rounded bg-[rgba(255,255,255,0.08)]"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="col-span-3 bg-[rgba(6,11,26,0.75)] p-5">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ["$48,290", "Revenue", "#7DB8FF"],
                      ["1,247", "Clients", "#048DFE"],
                      ["98.9%", "Uptime", "#4ADE80"],
                    ].map(([val, label, color]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-[rgba(148,163,184,0.1)] bg-[rgba(255,255,255,0.03)] p-3"
                      >
                        <p className="text-xs text-[#7A8FAF]">{label}</p>
                        <p
                          className="mt-1 text-lg font-bold"
                          style={{ color }}
                        >
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl border border-[rgba(148,163,184,0.1)] bg-[rgba(255,255,255,0.03)] p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#B8C6DE]">
                        Recent Invoices
                      </p>
                      <div className="h-2 w-12 rounded-full bg-[rgba(4,141,254,0.35)]" />
                    </div>
                    {[85, 72, 91, 68].map((w, i) => (
                      <div key={i} className="mt-2 flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-[#4ADE80]" />
                        <div
                          className="h-2 flex-1 rounded bg-[rgba(255,255,255,0.05)]"
                          style={{ width: `${w}%` }}
                        />
                        <div className="h-2 w-10 rounded bg-[rgba(4,141,254,0.25)]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-[#048dfe] opacity-25 blur-2xl" />
          </div>
        </div>
      </section>

      {/* ════════════ STATS BAR ════════════ */}
      <section className="border-y border-[rgba(148,163,184,0.08)] bg-[#080D1B]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {content.stats.map(({ value, label }) => (
              <div key={label}>
                <p className="bg-gradient-to-br from-[#7DB8FF] to-[#048DFE] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                  {value}
                </p>
                <p className="mt-1.5 text-sm text-[#93A5C1]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ VALUE PROPS ════════════ */}
      <section className="bg-[#070B16] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label mb-4">{content.sections.whyBadge}</span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              {content.sections.whyTitle}
            </h2>
            <p className="mt-4 text-lg text-[#93A5C1]">
              {content.sections.whyDescription}
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {content.valueProps.map(({ icon, color, title, body }) => (
              <div key={title} className="feature-card flex flex-col gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{
                    background: `${color}22`,
                    boxShadow: `inset 0 0 0 1px ${color}33`,
                  }}
                >
                  {icon}
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-sm leading-7 text-[#93A5C1]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ CAPABILITIES ════════════ */}
      <section className="bg-[#070B16] pb-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-[rgba(148,163,184,0.12)] bg-[linear-gradient(180deg,#0E1528_0%,#0A1020_100%)] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_40px_80px_rgba(0,0,0,0.45)] md:p-10 xl:grid xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:items-center xl:gap-10">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7DB8FF]">
                {compatibility.label}
              </div>
              <h2 className="mt-4 max-w-xl text-[2rem] font-semibold leading-[1.1] tracking-[-0.04em] text-white md:text-[2.5rem]">
                {compatibility.title}
              </h2>
              <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#93A5C1] md:text-base">
                {compatibility.description}
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3 xl:mt-0">
              {compatibility.platforms.map((platform) => (
                <div
                  key={platform.key}
                  className="rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[rgba(255,255,255,0.02)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_32px_rgba(0,0,0,0.35)] transition-all hover:border-[rgba(4,141,254,0.3)]"
                >
                  <CompatibilityLogo platform={platform.key} />
                  <div className="mt-4 text-sm font-semibold text-[#D4DEF0]">
                    {platform.label}
                  </div>
                  <div className="mt-3 text-sm leading-7 text-[#8398B8]">
                    {platform.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ PROVISIONING & BILLING ════════════ */}
      <section className="overflow-hidden bg-[#070B16] py-8">
        {/* Provisioning */}
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <span className="section-label mb-4">
                {content.sections.provisioningBadge}
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                {content.sections.provisioningTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-[#93A5C1]">
                {content.sections.provisioningDescription}
              </p>
              <ul className="mt-8 space-y-3">
                {content.provisioningFeatures.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-[#D4DEF0]"
                  >
                    <svg
                      className="h-5 w-5 shrink-0 text-[#48A2FF]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[linear-gradient(180deg,#0E1528_0%,#0A1020_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_24px_60px_rgba(0,0,0,0.45)]">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7DB8FF]">
                  {content.sections.provisioningBadge}
                </p>
                {[
                  ["CREATE_ACCOUNT", "domain.example.com", "#4ADE80", "Done"],
                  ["SUSPEND_SERVICE", "client-482.net", "#FACC15", "Pending"],
                  ["TERMINATE_ACCOUNT", "old-client.io", "#F87171", "Failed"],
                  ["RESET_PASSWORD", "shop.provider.com", "#60A5FA", "Running"],
                ].map(([action, domain, color, status]) => (
                  <div
                    key={domain}
                    className="mb-2.5 flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 last:mb-0"
                  >
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-[#D4DEF0]">
                        {action}
                      </p>
                      <p className="mt-0.5 text-xs text-[#8398B8]">{domain}</p>
                    </div>
                    <span
                      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
                      style={{
                        color,
                        background: `${color}18`,
                        borderColor: `${color}33`,
                      }}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Billing — reversed */}
        <div className="mx-auto max-w-7xl border-t border-[rgba(148,163,184,0.08)] px-6 py-16 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="order-last lg:order-first">
              <div className="overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[linear-gradient(180deg,#0E1528_0%,#0A1020_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_24px_60px_rgba(0,0,0,0.45)]">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7DB8FF]">
                  {content.sections.billingBadge}
                </p>
                {[
                  ["INV-2891", "$49.00", "Paid", "#4ADE80"],
                  ["INV-2890", "$149.00", "Due Today", "#FACC15"],
                  ["INV-2889", "$29.00", "Paid", "#4ADE80"],
                  ["INV-2888", "$299.00", "Overdue", "#F87171"],
                ].map(([inv, amount, status, color]) => (
                  <div
                    key={inv}
                    className="mb-2.5 flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 last:mb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(4,141,254,0.25)] bg-[rgba(4,141,254,0.1)] text-xs font-bold text-[#7DB8FF]">
                        $
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#D4DEF0]">
                          {inv}
                        </p>
                        <p className="mt-0.5 text-xs text-[#8398B8]">{amount}</p>
                      </div>
                    </div>
                    <span
                      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
                      style={{
                        color,
                        background: `${color}18`,
                        borderColor: `${color}33`,
                      }}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="section-label mb-4">
                {content.sections.billingBadge}
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                {content.sections.billingTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-[#93A5C1]">
                {content.sections.billingDescription}
              </p>
              <ul className="mt-8 space-y-3">
                {content.billingFeatures.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-[#D4DEF0]"
                  >
                    <svg
                      className="h-5 w-5 shrink-0 text-[#48A2FF]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ FEATURES GRID ════════════ */}
      <section className="bg-[#070B16] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label mb-4">
              {content.sections.featuresBadge}
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white">
              {content.sections.featuresDescription}
            </h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.features.map((feature, i) => {
              const icons = ["🏗️", "💳", "⚙️", "🌐", "🔒", "🛡️"];
              const colors = [
                "#048dfe",
                "#60a5fa",
                "#036deb",
                "#7DB8FF",
                "#048dfe",
                "#60a5fa",
              ];
              return (
                <div key={feature.title} className="feature-card">
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                    style={{
                      background: `${colors[i]}22`,
                      boxShadow: `inset 0 0 0 1px ${colors[i]}38`,
                    }}
                  >
                    {icons[i]}
                  </div>
                  <h3 className="font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#93A5C1]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <Link href={localePath(locale, "/features")} className="btn-secondary">
              {content.nav.features} →
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════ AUTOMATION WORKFLOW ════════════ */}
      <section className="bg-[#080D1B] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label mb-4">
              {content.sections.automationBadge}
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white">
              {content.sections.automationTitle}
            </h2>
            <p className="mt-4 text-lg text-[#93A5C1]">
              {content.sections.automationDescription}
            </p>
          </div>
          <div className="relative mt-16">
            <div className="absolute top-8 hidden h-0.5 w-full bg-gradient-to-r from-transparent via-[rgba(4,141,254,0.45)] to-transparent lg:block" />
            <div className="grid gap-8 lg:grid-cols-5">
              {content.automationSteps.map(({ step, title, desc, icon }) => (
                <div
                  key={step}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[rgba(4,141,254,0.3)] bg-[#0E1528] text-2xl shadow-[0_8px_32px_rgba(4,141,254,0.24),inset_0_1px_0_rgba(255,255,255,0.05)]">
                    {icon}
                  </div>
                  <div className="absolute top-0 -right-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-[#048dfe] text-[10px] font-bold text-white shadow-[0_0_12px_rgba(4,141,254,0.6)]">
                    {step}
                  </div>
                  <h3 className="mt-4 font-bold text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#93A5C1]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ PRICING ════════════ */}
      <section className="bg-[#070B16] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label mb-4">
              {content.sections.plansBadge}
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white">
              {content.sections.plansTitle}
            </h2>
            <p className="mt-3 text-lg text-[#93A5C1]">
              {content.sections.plansDescription}
            </p>
            <p className="mt-4 inline-block rounded-full border border-[rgba(4,141,254,0.3)] bg-[rgba(4,141,254,0.12)] px-4 py-1.5 text-sm font-medium text-[#7DB8FF]">
              {pricingNote}
            </p>
          </div>
          <div className="mt-16 grid gap-6 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={plan.featured ? "pricing-card-featured relative" : "pricing-card"}
              >
                {plan.featured ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[rgba(4,141,254,0.3)] bg-[#070B16] px-4 py-1 text-xs font-bold text-[#7DB8FF] shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                    {content.mostPopular}
                  </div>
                ) : null}
                <p
                  className={[
                    "text-xs font-semibold uppercase tracking-[0.22em]",
                    plan.featured ? "text-[rgba(255,255,255,0.78)]" : "text-[#7DB8FF]",
                  ].join(" ")}
                >
                  {plan.name}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={[
                      "text-5xl font-extrabold tracking-tight",
                      plan.featured ? "text-white" : "text-white",
                    ].join(" ")}
                  >
                    {plan.price}
                  </span>
                  {plan.key !== "free_trial" ? (
                    <span
                      className={[
                        "text-sm",
                        plan.featured ? "text-[rgba(255,255,255,0.7)]" : "text-[#8398B8]",
                      ].join(" ")}
                    >
                      {content.perMonth}
                    </span>
                  ) : null}
                </div>
                <p
                  className={[
                    "mt-2 text-sm leading-6",
                    plan.featured ? "text-[rgba(255,255,255,0.82)]" : "text-[#93A5C1]",
                  ].join(" ")}
                >
                  {plan.description}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {plan.limits.map((limit) => (
                    <li
                      key={limit}
                      className={[
                        "flex items-start gap-2 text-sm",
                        plan.featured ? "text-[rgba(255,255,255,0.9)]" : "text-[#D4DEF0]",
                      ].join(" ")}
                    >
                      <svg
                        className={[
                          "mt-0.5 h-4 w-4 shrink-0",
                          plan.featured ? "text-white" : "text-[#48A2FF]",
                        ].join(" ")}
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
                  className={[
                    "mt-8 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition",
                    plan.featured
                      ? "bg-white text-[#036deb] hover:bg-[#EEF4FF]"
                      : "btn-primary",
                  ].join(" ")}
                >
                  {plan.ctaLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ CTA BAND ════════════ */}
      <section className="relative overflow-hidden bg-[#060B18] py-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#048dfe] opacity-[0.14] blur-[110px]" />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[420px] rounded-full bg-[#036deb] opacity-[0.1] blur-[100px]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            {content.sections.ctaBandTitle}
          </h2>
          <p className="mt-4 text-lg text-[#93A5C1]">
            {content.sections.ctaBandDescription}
          </p>
          <p className="mt-2 text-sm text-[#6A7B99]">
            {content.sections.ctaBandSubnote}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={localePath(locale, "/onboarding")}
              className="btn-primary min-h-14 w-full justify-center gap-2.5 rounded-[1.1rem] px-8 text-base shadow-[0_8px_40px_rgba(4,141,254,0.55)] sm:w-auto sm:min-w-[208px] whitespace-nowrap"
            >
              {content.primaryCta}
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <Link
              href={localePath(locale, "/contact")}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-[1.1rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.05)] px-8 text-base font-semibold text-white transition hover:bg-[rgba(255,255,255,0.1)] sm:w-auto sm:min-w-[208px] whitespace-nowrap"
            >
              {content.sections.contactSales}
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
