import type { ReactNode } from "react";

import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/layout/brand-logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

type AuthShellProps = {
  children: ReactNode;
  locale: string;
  title: string;
  description: string;
  currentPath: string;
};

type ShellCopy = {
  badge: string;
  eyebrow: string;
  heading: string;
  description: string;
  features: Array<{
    key: string;
    title: string;
    description: string;
  }>;
  stats: Array<{
    value: string;
    label: string;
  }>;
  footer: string;
};

const shellCopyByLocale: Record<string, ShellCopy> = {
  en: {
    badge: "Licensed self-hosted platform",
    eyebrow: "Hostinvo Workspace Access",
    heading: "The smarter way to run your hosting business",
    description:
      "One self-hosted platform for billing, provisioning, client management, and automation. Built for providers who want to run Hostinvo on their own infrastructure.",
    features: [
      {
        key: "provisioning",
        title: "Instant provisioning",
        description:
          "Launch hosting services with driver-ready automation for cPanel and Plesk.",
      },
      {
        key: "billing",
        title: "Automated billing",
        description:
          "Recurring invoices, gateway collection, reminders, and payment visibility.",
      },
      {
        key: "tenancy",
        title: "Self-hosted licensing",
        description:
          "Install Hostinvo on your own infrastructure with tenant-aware controls and plan-based licensing.",
      },
      {
        key: "security",
        title: "Enterprise security",
        description:
          "Tenant-aware auth, auditability, throttling, and hardened platform controls.",
      },
    ],
    stats: [
      { value: "500+", label: "Providers" },
      { value: "1M+", label: "Invoices" },
      { value: "99.9%", label: "Uptime" },
    ],
    footer:
      "Secure provider access for self-hosted billing, provisioning, tenant administration, and customer operations.",
  },
  ar: {
    badge: "منصة مرخصة ذاتية الاستضافة",
    eyebrow: "الوصول إلى مساحة عمل Hostinvo",
    heading: "الطريقة الأذكى لإدارة أعمال الاستضافة",
    description:
      "منصة ذاتية الاستضافة للفوترة والتزويد وإدارة العملاء والأتمتة. مصممة لمزودي الخدمة الذين يريدون تشغيل Hostinvo على بنيتهم التحتية الخاصة.",
    features: [
      {
        key: "provisioning",
        title: "تزويد فوري",
        description: "أطلق خدمات الاستضافة عبر أتمتة جاهزة للتكامل مع cPanel وPlesk.",
      },
      {
        key: "billing",
        title: "فوترة تلقائية",
        description: "فواتير متكررة وتحصيل عبر البوابات وتذكيرات ورؤية مالية واضحة.",
      },
      {
        key: "tenancy",
        title: "ترخيص ذاتي الاستضافة",
        description:
          "شغّل Hostinvo على بنيتك الخاصة مع ضوابط واعية بالمستأجر وحدود ترخيص مرتبطة بالخطة.",
      },
      {
        key: "security",
        title: "أمان مؤسسي",
        description: "مصادقة واعية بالمستأجر وسجلات تدقيق وتحديد معدل وضوابط منصة محكمة.",
      },
    ],
    stats: [
      { value: "500+", label: "مزود" },
      { value: "+1M", label: "فاتورة" },
      { value: "99.9%", label: "وقت التشغيل" },
    ],
    footer: "وصول آمن للفوترة والتزويد وإدارة المستأجر وتشغيل العملاء على بنية ذاتية.",
  },
};

function FeatureIcon({ featureKey }: { featureKey: string }) {
  const classes =
    "h-[1.05rem] w-[1.05rem] text-[#45b6ff] transition-transform duration-300 group-hover:scale-105";

  switch (featureKey) {
    case "provisioning":
      return (
        <svg className={classes} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M13 3l-8 10h6l-1 8 9-12h-6l0-6z"
          />
        </svg>
      );
    case "billing":
      return (
        <svg className={classes} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 8c-2.5 0-4 1.12-4 2.5S9.5 13 12 13s4 1.12 4 2.5S14.5 18 12 18m0-12v12m6-9V7a2 2 0 00-2-2H8a2 2 0 00-2 2v2m12 6v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2"
          />
        </svg>
      );
    case "tenancy":
      return (
        <svg className={classes} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 7h16M7 4v16m10-6l-5-3-5 3m0 0v5m10-5v5"
          />
        </svg>
      );
    default:
      return (
        <svg className={classes} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      );
  }
}

export async function AuthShell({
  children,
  locale,
  title,
  description,
  currentPath,
}: AuthShellProps) {
  const t = await getTranslations("Auth");
  const shellCopy = shellCopyByLocale[locale] ?? shellCopyByLocale.en;
  const isRtl = locale === "ar";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef4fb_100%)] text-[#0a1628]"
    >
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(4,141,254,0.22),transparent_28rem),linear-gradient(155deg,#00154d_0%,#002d8e_52%,#0054c5_100%)]" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,rgba(4,141,254,0.32),transparent_60%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
            <div className="max-w-xl">
              <BrandLogo
                href={`/${locale}`}
                priority
                className="block w-full max-w-[13.5rem] brightness-0 invert"
              />
              <div className="mt-10 inline-flex rounded-full border border-white/15 bg-[#faf9f5]/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#d7ebff]">
                {shellCopy.badge}
              </div>
              <h1 className="mt-8 max-w-lg text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.05em] text-white">
                {shellCopy.heading}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#d0e5ff]">
                {shellCopy.description}
              </p>

              <div className="mt-10 grid gap-5">
                {shellCopy.features.map((feature) => (
                  <div
                    key={feature.key}
                    className="group rounded-[1.25rem] transition duration-300 hover:translate-x-1"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-[rgba(89,168,255,0.08)] bg-[linear-gradient(180deg,rgba(7,78,170,0.78),rgba(4,49,124,0.88))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_24px_rgba(0,0,0,0.16)]">
                        <FeatureIcon featureKey={feature.key} />
                      </div>
                      <div>
                        <h2 className="text-[1.05rem] font-semibold leading-6 tracking-[-0.01em] text-white">
                          {feature.title}
                        </h2>
                        <p className="mt-1 text-[0.95rem] leading-7 text-[#9ebedd]">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-10 rounded-[1.75rem] border border-white/10 bg-[#faf9f5]/[0.08] px-6 py-6 backdrop-blur-md">
              <div className="grid grid-cols-3 gap-4">
                {shellCopy.stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl font-semibold tracking-[-0.04em] text-white">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-[#b7d5fb]">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-[#d0e5ff]">
                {shellCopy.footer}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-h-screen flex-col">
          <div className="flex items-center justify-between px-6 py-5 sm:px-8 xl:px-10">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#365277] transition hover:text-[#036deb]"
            >
              <svg
                className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>{t("backToHome")}</span>
            </Link>
            <LocaleSwitcher currentLocale={locale as "en" | "ar"} path={currentPath} />
          </div>

          <div className="flex flex-1 items-center px-6 pb-10 pt-2 sm:px-8 xl:px-10">
            <div className="mx-auto grid w-full max-w-2xl gap-8 lg:max-w-[34rem]">
              <div className="lg:hidden">
                <div className="mt-6 rounded-[1.75rem] border border-[#d4e6fb] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,247,255,0.9))] p-5 shadow-[0_20px_60px_rgba(12,53,120,0.08)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#036deb]">
                    {shellCopy.badge}
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#0a1628]">
                    {shellCopy.heading}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#516a86]">
                    {shellCopy.description}
                  </p>
                </div>
              </div>

              <div>
                <BrandLogo
                  href={`/${locale}`}
                  priority
                  className="mx-auto mb-6 block w-full max-w-[12rem]"
                />
                <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#5f7ca5]">
                  {shellCopy.eyebrow}
                </div>
                <h1 className="mt-4 text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.05em] text-[#0a1628]">
                  {title}
                </h1>
                <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#4e6782]">
                  {description}
                </p>
              </div>

              <div>{children}</div>

              <div className="border-t border-[#d6e5f6] pt-5 text-xs leading-6 text-[#7390af]">
                {shellCopy.footer}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
