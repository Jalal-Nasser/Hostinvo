import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { getLaunchContent } from "@/lib/launch-content";

const releases = [
  { version: "v1.0.0", date: "March 2026", badge: "GA", badgeColor: "#28c840",
    items: ["Initial production release", "Multi-tenant billing and provisioning", "cPanel & Plesk driver support", "Stripe & PayPal gateway integration", "Arabic & English localization", "Full Docker production topology", "Health & metrics monitoring endpoints"] },
  { version: "v0.9.0", date: "February 2026", badge: "RC", badgeColor: "#048dfe",
    items: ["Provider onboarding wizard (4-step)", "Licensing and activation system", "Beta validation and load testing", "Performance optimization: N+1 fixes, partial DB indexes", "Pagination trait and cache configuration"] },
  { version: "v0.8.0", date: "January 2026", badge: "Beta", badgeColor: "#ffbd2e",
    items: ["Integration test suite completed", "Staging environment configuration", "CI/CD GitHub Actions pipeline", "Monitoring and alert webhook delivery", "Queue priority tiers: critical, default, low, failed"] },
];

const releasesAr = [
  { version: "v1.0.0", date: "مارس 2026", badge: "إصدار رسمي", badgeColor: "#28c840",
    items: ["الإصدار الإنتاجي الأول", "فوترة وتزويد متعدد المستأجرين", "دعم تكامل cPanel وPlesk", "تكامل بوابتَي Stripe وPayPal", "ترجمة عربية وإنجليزية", "بنية Docker إنتاجية كاملة", "نقاط نهاية الصحة والمقاييس"] },
  { version: "v0.9.0", date: "فبراير 2026", badge: "مرشح إصدار", badgeColor: "#048dfe",
    items: ["معالج إعداد مزود الخدمة (4 خطوات)", "نظام الترخيص والتفعيل", "التحقق من بيتا واختبار الحمل", "تحسين الأداء: إصلاح N+1 وفهارس جزئية", "خاصية pagination وتهيئة التخزين المؤقت"] },
  { version: "v0.8.0", date: "يناير 2026", badge: "بيتا", badgeColor: "#ffbd2e",
    items: ["اكتمال مجموعة اختبارات التكامل", "تهيئة بيئة التجهيز", "خط CI/CD على GitHub Actions", "تسليم التنبيهات عبر Webhook", "أولويات الطوابير: حرجة وافتراضية ومنخفضة وفاشلة"] },
];

export default async function ChangelogPage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;
  const isAr = locale === "ar";
  const data = isAr ? releasesAr : releases;

  return (
    <MarketingShell currentPath="/changelog" locale={locale}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] via-[#0054c5] to-[#048dfe]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="section-label mb-5">{p.changelogBadge}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">{p.changelogTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#b3d4f5]">{p.changelogDesc}</p>
        </div>
      </section>

      <section className="bg-[#f7faff] py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="space-y-10">
            {data.map((release) => (
              <div key={release.version} className="relative">
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-xl font-extrabold text-[#0a1628]">{release.version}</span>
                  <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: release.badgeColor }}>{release.badge}</span>
                  <span className="text-sm text-[#7a95b5]">{release.date}</span>
                </div>
                <div className="rounded-2xl border border-[rgba(4,141,254,0.12)] bg-white p-6">
                  <ul className="space-y-2.5">
                    {release.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[#4a5e7a]">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#048dfe]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
