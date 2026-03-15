import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";

export default async function AboutPage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;
  const isAr = locale === "ar";

  const values = isAr
    ? [{ icon: "🎯", title: "التركيز", desc: "نبني أدوات مخصصة لمزودي الاستضافة تحديداً — لا نحاول إرضاء الجميع." },
       { icon: "🔍", title: "الشفافية", desc: "أسعار واضحة وتوثيق مفتوح وعدم وجود رسوم مخفية." },
       { icon: "⚡", title: "الموثوقية", desc: "نعطي الأولوية للاستقرار والأداء والجاهزية الإنتاجية في كل إصدار." },
       { icon: "🤝", title: "الشراكة", desc: "نعامل عملاءنا كشركاء، لا مجرد مستخدمين." }]
    : [{ icon: "🎯", title: "Focus", desc: "We build purpose-built tooling for hosting providers specifically — we don't try to serve everyone." },
       { icon: "🔍", title: "Transparency", desc: "Clear pricing, open documentation, and no hidden fees." },
       { icon: "⚡", title: "Reliability", desc: "We prioritize stability, performance, and production-readiness in every release." },
       { icon: "🤝", title: "Partnership", desc: "We treat our customers as partners, not just users." }];

  const stack = [
    { name: "Laravel", role: isAr ? "إطار الواجهة الخلفية" : "Backend framework" },
    { name: "Next.js", role: isAr ? "إطار الواجهة الأمامية" : "Frontend framework" },
    { name: "PostgreSQL", role: isAr ? "قاعدة البيانات الرئيسية" : "Primary database" },
    { name: "Redis", role: isAr ? "ذاكرة التخزين المؤقت والطوابير" : "Cache & queue broker" },
    { name: "Docker", role: isAr ? "بيئة الحاويات" : "Container runtime" },
    { name: "Tailwind CSS", role: isAr ? "نظام التنسيق" : "Styling system" },
  ];

  return (
    <MarketingShell currentPath="/about" locale={locale}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] via-[#0054c5] to-[#048dfe]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="section-label mb-5">{p.aboutBadge}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">{p.aboutTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#b3d4f5]">{p.aboutDesc}</p>
        </div>
      </section>

      <section className="bg-[#f7faff] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-20">
          {/* Mission */}
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="section-label mb-4">{p.aboutMissionTitle}</p>
              <p className="mt-4 text-lg leading-8 text-[#4a5e7a]">{p.aboutMissionDesc}</p>
              <p className="mt-4 text-base leading-8 text-[#4a5e7a]">{isAr ? "تعني منافسة WHMCS أكثر من مجرد مطابقة الميزات — بل تعني تقديم هندسة معمارية أفضل وتجربة مطور أفضل وتكلفة أقل وصفر تنازلات في الأمان والموثوقية." : "Competing with WHMCS means more than matching features — it means delivering better architecture, better developer experience, lower cost, and zero compromises on security and reliability."}</p>
            </div>
            <div className="grid gap-4 grid-cols-2">
              {content.stats.map(({ value, label }) => (
                <div key={label} className="feature-card text-center">
                  <p className="text-3xl font-extrabold text-[#048dfe]">{value}</p>
                  <p className="mt-1 text-sm text-[#4a5e7a]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stack */}
          <div>
            <h2 className="text-2xl font-extrabold text-[#0a1628] mb-8">{p.aboutStackTitle}</h2>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {stack.map(({ name, role }) => (
                <div key={name} className="feature-card text-center">
                  <p className="font-bold text-[#048dfe]">{name}</p>
                  <p className="mt-1 text-xs text-[#4a5e7a]">{role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Values */}
          <div>
            <h2 className="text-2xl font-extrabold text-[#0a1628] mb-8">{p.aboutValuesTitle}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {values.map(({ icon, title, desc }) => (
                <div key={title} className="feature-card flex flex-col gap-3">
                  <span className="text-3xl">{icon}</span>
                  <h3 className="font-bold text-[#0a1628]">{title}</h3>
                  <p className="text-sm leading-6 text-[#4a5e7a]">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl bg-[#002d8e] p-10 text-center">
            <h2 className="text-2xl font-extrabold text-white">{content.sections.ctaBandTitle}</h2>
            <p className="mt-2 text-[#93b4d8]">{content.sections.ctaBandDescription}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link href={localePath(locale, "/onboarding")} className="btn-primary px-8 py-3">{content.primaryCta}</Link>
              <Link href={localePath(locale, "/contact")} className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.08)] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.14)]">{content.sections.contactSales}</Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
