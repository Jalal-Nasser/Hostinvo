import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";

const guidesEn = [
  { cat: "Setup", icon: "🚀", guides: [
    { title: "Getting started in 10 minutes", desc: "Clone the repo, configure environment variables, and have a working local instance running." },
    { title: "Setting up your first server", desc: "Connect a cPanel/WHM or Plesk server and verify the provisioning driver is operational." },
    { title: "Creating and publishing products", desc: "Define hosting packages with pricing cycles, limits, and provisioning rules." },
  ]},
  { cat: "Billing", icon: "💳", guides: [
    { title: "Configuring Stripe", desc: "Set up Stripe keys, configure webhooks, and test the payment flow end-to-end." },
    { title: "Configuring PayPal", desc: "Connect PayPal credentials, configure IPN webhooks, and verify payment handling." },
    { title: "Setting up auto-renewal", desc: "Configure billing cycles, dunning schedules, and late fee automation." },
  ]},
  { cat: "Operations", icon: "⚙️", guides: [
    { title: "Production deployment guide", desc: "Step-by-step deployment: environment setup, Docker startup, migrations, cache warmup." },
    { title: "Backup and recovery", desc: "Schedule automated backups and understand the restore procedure for each component." },
    { title: "Monitoring your platform", desc: "Set up health check probes, configure alert thresholds, and use the metrics endpoints." },
  ]},
  { cat: "Localization", icon: "🌍", guides: [
    { title: "Adding a new locale", desc: "Extend the platform to support additional languages alongside English and Arabic." },
    { title: "RTL layout reference", desc: "How RTL/LTR switching works and how to maintain it when adding new components." },
  ]},
];

const guidesAr = [
  { cat: "الإعداد", icon: "🚀", guides: [
    { title: "البدء في 10 دقائق", desc: "استنسخ المشروع، اضبط متغيرات البيئة، وشغّل نسخة محلية تعمل بالكامل." },
    { title: "إعداد أول خادم", desc: "اربط خادم cPanel/WHM أو Plesk وتحقق من تشغيل برنامج التزويد." },
    { title: "إنشاء ونشر المنتجات", desc: "عرّف حزم الاستضافة مع دورات الأسعار والحدود وقواعد التزويد." },
  ]},
  { cat: "الفوترة", icon: "💳", guides: [
    { title: "تهيئة Stripe", desc: "أعدّ مفاتيح Stripe وWebhooks واختبر تدفق الدفع من البداية للنهاية." },
    { title: "تهيئة PayPal", desc: "ربط بيانات PayPal وتهيئة IPN Webhooks والتحقق من معالجة الدفع." },
    { title: "إعداد التجديد التلقائي", desc: "هيّئ دورات الفوترة وجداول التحصيل وأتمتة الرسوم المتأخرة." },
  ]},
  { cat: "التشغيل", icon: "⚙️", guides: [
    { title: "دليل النشر الإنتاجي", desc: "نشر خطوة بخطوة: إعداد البيئة وتشغيل Docker والترحيل وتدفئة التخزين المؤقت." },
    { title: "النسخ الاحتياطي والاسترداد", desc: "جدولة النسخ الاحتياطية التلقائية وفهم إجراء الاستعادة لكل مكوّن." },
    { title: "مراقبة المنصة", desc: "إعداد فحوصات الصحة وتهيئة حدود التنبيه واستخدام نقاط نهاية المقاييس." },
  ]},
  { cat: "الترجمة", icon: "🌍", guides: [
    { title: "إضافة لغة جديدة", desc: "توسيع المنصة لدعم لغات إضافية إلى جانب العربية والإنجليزية." },
    { title: "مرجع تخطيط RTL", desc: "كيفية عمل التبديل بين RTL وLTR وكيفية الحفاظ عليه عند إضافة مكونات جديدة." },
  ]},
];

export default async function GuidesPage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;
  const isAr = locale === "ar";
  const guides = isAr ? guidesAr : guidesEn;

  return (
    <MarketingShell currentPath="/guides" locale={locale}>
      <section className="relative overflow-hidden border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] via-[#0054c5] to-[#048dfe]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="section-label mb-5">{p.guidesBadge}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">{p.guidesTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#b3d4f5]">{p.guidesDesc}</p>
        </div>
      </section>

      <section className="bg-[#f7faff] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-14">
          {guides.map(({ cat, icon, guides: items }) => (
            <div key={cat}>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <h2 className="text-xl font-extrabold text-[#0a1628]">{cat}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {items.map(({ title, desc }) => (
                  <div key={title} className="feature-card group cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-[#0a1628] group-hover:text-[#048dfe] transition-colors">{title}</h3>
                      <svg className="h-4 w-4 shrink-0 text-[#7a95b5] group-hover:text-[#048dfe] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <p className="text-sm leading-6 text-[#4a5e7a]">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="rounded-2xl bg-[#002d8e] p-8 text-center">
            <p className="text-lg font-bold text-white">{isAr ? "هل تبحث عن التوثيق الكامل؟" : "Looking for full documentation?"}</p>
            <Link href={localePath(locale, "/documentation")} className="btn-primary mt-4 inline-flex px-6 py-3 text-sm">{p.viewDocs}</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
