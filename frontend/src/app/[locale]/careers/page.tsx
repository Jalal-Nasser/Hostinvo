import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { getLaunchContent } from "@/lib/launch-content";

export default async function CareersPage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;
  const isAr = locale === "ar";

  const perks = isAr
    ? [{ icon: "🌍", t: "عمل عن بُعد بالكامل" }, { icon: "⏰", t: "ساعات عمل مرنة" }, { icon: "📚", t: "ميزانية تعلم سنوية" }, { icon: "🚀", t: "تأثير مباشر على المنتج" }, { icon: "💻", t: "أجهزة وبيئة عمل" }, { icon: "🏖️", t: "إجازة مرنة" }]
    : [{ icon: "🌍", t: "Fully remote" }, { icon: "⏰", t: "Flexible hours" }, { icon: "📚", t: "Annual learning budget" }, { icon: "🚀", t: "Direct product impact" }, { icon: "💻", t: "Equipment & setup" }, { icon: "🏖️", t: "Flexible PTO" }];

  return (
    <MarketingShell currentPath="/careers" locale={locale}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] via-[#0054c5] to-[#048dfe]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="section-label mb-5">{p.careersBadge}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">{p.careersTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#b3d4f5]">{p.careersDesc}</p>
        </div>
      </section>

      <section className="bg-[#f7faff] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-16">
          {/* Perks */}
          <div>
            <h2 className="text-2xl font-extrabold text-[#0a1628] mb-8">{isAr ? "ما نقدمه" : "What we offer"}</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {perks.map(({ icon, t }) => (
                <div key={t} className="feature-card text-center py-6">
                  <span className="text-2xl">{icon}</span>
                  <p className="mt-3 text-sm font-semibold text-[#0a1628]">{t}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Open positions */}
          <div>
            <h2 className="text-2xl font-extrabold text-[#0a1628] mb-6">{p.careersOpenTitle}</h2>
            <div className="rounded-2xl border border-[rgba(4,141,254,0.12)] bg-[#faf9f5] p-10 text-center">
              <span className="text-4xl">📭</span>
              <p className="mt-4 text-[#4a5e7a]">{p.careersNoOpenings}</p>
            </div>
          </div>

          {/* Speculative */}
          <div className="rounded-2xl border border-[rgba(4,141,254,0.12)] bg-[#faf9f5] p-8">
            <h2 className="text-xl font-extrabold text-[#0a1628] mb-3">{p.careersSpecTitle}</h2>
            <p className="text-[#4a5e7a] text-sm leading-7">{p.careersSpecDesc}</p>
            <a href={`mailto:${content.contact.email}`} className="btn-primary mt-6 inline-flex px-6 py-3 text-sm">
              {isAr ? "أرسل طلبك" : "Send application"} — {content.contact.email}
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
