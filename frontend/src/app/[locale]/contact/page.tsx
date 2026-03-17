import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { getLaunchContent } from "@/lib/launch-content";

export default async function ContactPage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;

  const whoCards = [
    { icon: "🔄", title: locale === "ar" ? "الترحيل من WHMCS" : "Migrating from WHMCS", desc: p.contactMigrationDesc },
    { icon: "🏢", title: p.contactEnterpriseTitle, desc: p.contactEnterpriseDesc },
    { icon: "🚀", title: locale === "ar" ? "إطلاق عمل جديد" : "Launching a new operation", desc: locale === "ar" ? "ابدأ عملك في الاستضافة بالبنية التحتية الصحيحة والأسعار المناسبة من اليوم الأول." : "Get your hosting business started on the right infrastructure with the right pricing from day one." },
    { icon: "📈", title: locale === "ar" ? "توسيع عملية قائمة" : "Scaling an existing operation", desc: locale === "ar" ? "إذا كنت تتجاوز حدود منصتك الحالية، يمكننا مساعدتك في التخطيط للتوسع." : "If you're outgrowing your current platform, we can help you plan the transition and scale." },
  ];

  return (
    <MarketingShell currentPath="/contact" locale={locale}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] via-[#0054c5] to-[#048dfe]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="section-label mb-5">{p.contactBadge}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">{p.contactHeroTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#b3d4f5]">{p.contactHeroDesc}</p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] px-6 py-4">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{p.contactResponseTime}</p>
              <p className="text-sm text-[#93b4d8]">{p.contactResponseLabel}</p>
            </div>
            <div className="mx-4 h-10 w-px bg-[rgba(255,255,255,0.15)]" />
            <div className="text-center">
              <p className="text-lg font-bold text-white">{content.contact.salesHours}</p>
              <p className="text-sm text-[#93b4d8]">{locale === "ar" ? "أوقات عمل المبيعات" : "Sales hours"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7faff] py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            {/* Left: who should contact + info */}
            <div>
              <h2 className="text-2xl font-extrabold text-[#0a1628]">{p.contactWhoTitle}</h2>
              <div className="mt-6 grid gap-4">
                {whoCards.map((card) => (
                  <div key={card.title} className="feature-card flex gap-4">
                    <div className="text-2xl shrink-0">{card.icon}</div>
                    <div>
                      <h3 className="font-bold text-[#0a1628]">{card.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#4a5e7a]">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-[rgba(4,141,254,0.12)] bg-[#faf9f5] p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[#048dfe] mb-3">{locale === "ar" ? "معلومات التواصل" : "Contact details"}</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-[#4a5e7a]">
                    <span className="text-[#048dfe]">✉</span> <span>{content.contact.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#4a5e7a]">
                    <span className="text-[#048dfe]">🕐</span> <span>{content.contact.salesHours}</span>
                  </div>
                  <p className="text-sm leading-6 text-[#4a5e7a] pt-2 border-t border-[rgba(4,141,254,0.08)]">{content.contact.note}</p>
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div className="rounded-2xl border border-[rgba(4,141,254,0.12)] bg-[#faf9f5] p-8 shadow-[0_8px_32px_rgba(4,141,254,0.08)]">
              <h2 className="text-2xl font-extrabold text-[#0a1628]">{content.contact.formTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-[#4a5e7a]">{content.contact.formDescription}</p>
              <form className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="rounded-xl border border-[rgba(4,141,254,0.15)] bg-[#f7faff] px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#048dfe] focus:bg-[#faf9f5]" placeholder={content.contact.formNamePlaceholder} type="text" />
                  <input className="rounded-xl border border-[rgba(4,141,254,0.15)] bg-[#f7faff] px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#048dfe] focus:bg-[#faf9f5]" placeholder={content.contact.formEmailPlaceholder} type="email" />
                </div>
                <select className="rounded-xl border border-[rgba(4,141,254,0.15)] bg-[#f7faff] px-4 py-3 text-sm text-[#4a5e7a] outline-none transition focus:border-[#048dfe] focus:bg-[#faf9f5]">
                  <option value="">{locale === "ar" ? "نوع الطلب" : "Inquiry type"}</option>
                  <option>{locale === "ar" ? "الترحيل من WHMCS" : "Migration from WHMCS"}</option>
                  <option>{locale === "ar" ? "إعداد مؤسسي" : "Enterprise onboarding"}</option>
                  <option>{locale === "ar" ? "استفسار عن الأسعار" : "Pricing inquiry"}</option>
                  <option>{locale === "ar" ? "دعم تقني" : "Technical support"}</option>
                  <option>{locale === "ar" ? "أخرى" : "Other"}</option>
                </select>
                <input className="rounded-xl border border-[rgba(4,141,254,0.15)] bg-[#f7faff] px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#048dfe] focus:bg-[#faf9f5]" placeholder={locale === "ar" ? "اسم الشركة" : "Company name"} type="text" />
                <textarea className="min-h-36 rounded-xl border border-[rgba(4,141,254,0.15)] bg-[#f7faff] px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#048dfe] focus:bg-[#faf9f5] resize-none" placeholder={content.contact.formRequirementsPlaceholder} />
                <button className="btn-primary w-full justify-center py-3.5 text-base" type="button">{content.contact.formButtonLabel}</button>
                <p className="text-center text-xs text-[#7a95b5]">{locale === "ar" ? "نردّ خلال أقل من 4 ساعات في أوقات العمل." : "We typically respond within 4 business hours."}</p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
