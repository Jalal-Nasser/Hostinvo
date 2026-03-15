import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";

export default async function FeaturesPage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;

  const capabilityBlocks = [
    { icon: "🏗️", color: "#048dfe", title: locale === "ar" ? "بنية متعددة المستأجرين" : "Multi-tenant Architecture", items: locale === "ar"
        ? ["عزل tenant_id على مستوى قاعدة البيانات","TenantScope عالمي على جميع النماذج","Middleware وسياسات وصول لكل مستأجر","جلسات محدودة النطاق بالمستأجر"]
        : ["Database-level tenant_id isolation","Global TenantScope on all models","Per-tenant middleware and access policies","Tenant-scoped sessions"] },
    { icon: "💳", color: "#0054c5", title: locale === "ar" ? "الفوترة والدفع" : "Billing & Payments", items: locale === "ar"
        ? ["فواتير متكررة تلقائية","تكامل Stripe وPayPal","معالجة Webhooks مع التحقق من التوقيعات","أتمتة الرسوم المتأخرة والتحصيل"]
        : ["Automated recurring invoices","Stripe & PayPal integration","Webhook processing with signature verification","Late fee automation and dunning"] },
    { icon: "⚙️", color: "#036deb", title: locale === "ar" ? "أتمتة التزويد" : "Provisioning Automation", items: locale === "ar"
        ? ["تكامل cPanel/WHM وPlesk","طوابير Redis رباعية المستويات","إعادة محاولة تلقائية مع تراجع تدريجي","سجلات تزويد في الوقت الفعلي"]
        : ["cPanel/WHM and Plesk drivers","4-tier Redis queues","Auto-retry with exponential backoff","Real-time provisioning logs"] },
    { icon: "🌐", color: "#002d8e", title: locale === "ar" ? "إدارة النطاقات" : "Domain Management", items: locale === "ar"
        ? ["تسجيل النطاقات وتجديدها","إدارة بيانات الاتصال","تكامل سجلات DNS","أتمتة طلبات النطاق"]
        : ["Domain registration and renewal","Contact data management","DNS record integration","Domain order automation"] },
    { icon: "🎫", color: "#048dfe", title: locale === "ar" ? "دعم العملاء" : "Client Support", items: locale === "ar"
        ? ["إنشاء تذاكر الدعم","تعيين الموظفين وخيوط الردود","أتمتة حالة التذكرة","سجل محادثة كامل"]
        : ["Support ticket creation","Staff assignment and reply threading","Ticket status automation","Full conversation history"] },
    { icon: "🔒", color: "#0054c5", title: locale === "ar" ? "الأمان" : "Security", items: locale === "ar"
        ? ["حماية XSS المخزّن","تحديد معدل الطلبات","قائمة السماح للـ Webhooks","تحقق CSRF وحماية التوكنات"]
        : ["Stored-XSS protections","Rate limiting on all routes","Webhook allowlisting","CSRF verification and token safety"] },
    { icon: "🌍", color: "#036deb", title: locale === "ar" ? "الترجمة وRTL" : "Localization & RTL", items: locale === "ar"
        ? ["دعم كامل للعربية والإنجليزية","تبديل تلقائي RTL/LTR","مسارات مرتبطة باللغة","ترجمة واجهة المستخدم الكاملة"]
        : ["Full English and Arabic support","Automatic RTL/LTR switching","Locale-based routing","Complete UI translation"] },
    { icon: "📊", color: "#002d8e", title: locale === "ar" ? "المراقبة والتشغيل" : "Monitoring & Operations", items: locale === "ar"
        ? ["نقاط نهاية الصحة (/health وفروعها)","مقاييس Prometheus","تنبيهات تلقائية عبر Webhook","بنية Docker للإنتاج"]
        : ["Health endpoints (/health and sub-checks)","Prometheus metrics endpoint","Automated alert webhooks","Production Docker topology"] },
  ];

  return (
    <MarketingShell currentPath="/features" locale={locale}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] via-[#0054c5] to-[#048dfe]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="section-label mb-5">{p.featuresBadge}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">{p.featuresHeroTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#b3d4f5]">{p.featuresHeroDesc}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={localePath(locale, "/onboarding")} className="btn-primary px-6 py-3">{content.primaryCta}</Link>
            <Link href={localePath(locale, "/pricing")} className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.08)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.14)]">{content.nav.pricing}</Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-[rgba(4,141,254,0.1)] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {content.stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-[#048dfe]">{value}</p>
                <p className="mt-1 text-sm text-[#4a5e7a]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="bg-[#f7faff] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="section-label mb-3">{p.featuresCapTitle}</p>
            <p className="mt-3 max-w-xl mx-auto text-base text-[#4a5e7a]">{p.featuresCapDesc}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {capabilityBlocks.map(({ icon, color, title, items }) => (
              <div key={title} className="feature-card flex flex-col gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl" style={{ background: `${color}15` }}>{icon}</div>
                <h3 className="font-bold text-[#0a1628]">{title}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[#4a5e7a]">
                      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#048dfe]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 text-center border-t border-[rgba(4,141,254,0.08)]">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-extrabold text-[#0a1628]">{content.sections.ctaBandTitle}</h2>
          <p className="mt-3 text-[#4a5e7a]">{content.sections.ctaBandDescription}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href={localePath(locale, "/onboarding")} className="btn-primary px-8 py-3">{content.primaryCta}</Link>
            <Link href={localePath(locale, "/pricing")} className="btn-secondary px-8 py-3">{content.nav.pricing}</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
