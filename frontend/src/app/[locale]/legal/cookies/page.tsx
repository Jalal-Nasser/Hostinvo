import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { getLaunchContent } from "@/lib/launch-content";

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[rgba(4,141,254,0.08)] pb-10 last:border-0">
      <h2 className="mb-4 text-xl font-bold text-[#0a1628]">{title}</h2>
      <div className="space-y-3 text-[15px] leading-7 text-[#4a5e7a]">{children}</div>
    </div>
  );
}

export default async function CookiesPage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;
  const isAr = locale === "ar";

  const cookieTypes = isAr
    ? [
        { type: "ضرورية", desc: "مطلوبة لتشغيل المنصة الأساسي — إدارة الجلسات والمصادقة وأمان CSRF.", can: "لا يمكن تعطيلها" },
        { type: "وظيفية", desc: "تتذكر تفضيلاتك مثل اللغة والبلد والمنطقة الزمنية.", can: "اختيارية" },
        { type: "تحليلية", desc: "تساعدنا في فهم كيفية استخدام المنصة لتحسينها.", can: "اختيارية" },
      ]
    : [
        { type: "Essential", desc: "Required for core platform operation — session management, authentication, and CSRF security.", can: "Cannot be disabled" },
        { type: "Functional", desc: "Remember your preferences such as language, locale, and timezone.", can: "Optional" },
        { type: "Analytical", desc: "Help us understand how the platform is used so we can improve it.", can: "Optional" },
      ];

  return (
    <MarketingShell currentPath="/legal/cookies" locale={locale}>
      <section className="border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] to-[#0054c5]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="section-label mb-4">{p.cookiesBadge}</p>
          <h1 className="text-4xl font-extrabold text-white">{p.cookiesTitle}</h1>
          <p className="mt-3 text-[#b3d4f5]">{p.lastUpdated}</p>
        </div>
      </section>

      <section className="bg-[#faf9f5] py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="space-y-10">
            <LegalSection title={isAr ? "1. ما هي الكوكيز؟" : "1. What are cookies?"}>
              <p>{isAr ? "الكوكيز ملفات نصية صغيرة تُخزَّن في متصفحك عند زيارة موقع ويب. تُستخدم لتمكين وظائف معينة وتحسين تجربتك وجمع معلومات محدودة عن استخدامك للمنصة." : "Cookies are small text files stored in your browser when you visit a website. They are used to enable certain functionality, improve your experience, and collect limited information about your platform usage."}</p>
            </LegalSection>

            <LegalSection title={isAr ? "2. الكوكيز التي نستخدمها" : "2. Cookies we use"}>
              <div className="overflow-hidden rounded-xl border border-[rgba(4,141,254,0.12)]">
                <div className="grid grid-cols-3 gap-0 border-b border-[rgba(4,141,254,0.08)] bg-[#f7faff] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#7a95b5]">
                  <span>{isAr ? "النوع" : "Type"}</span><span>{isAr ? "الغرض" : "Purpose"}</span><span>{isAr ? "التحكم" : "Control"}</span>
                </div>
                {cookieTypes.map(({ type, desc, can }, i) => (
                  <div key={type} className={`grid grid-cols-3 gap-4 px-5 py-4 text-sm ${i % 2 === 0 ? "bg-[#faf9f5]" : "bg-[#fafcff]"}`}>
                    <span className="font-semibold text-[#0a1628]">{type}</span>
                    <span className="text-[#4a5e7a]">{desc}</span>
                    <span className="text-[#4a5e7a]">{can}</span>
                  </div>
                ))}
              </div>
            </LegalSection>

            <LegalSection title={isAr ? "3. الكوكيز من أطراف ثالثة" : "3. Third-party cookies"}>
              <p>{isAr ? "تستخدم بوابات الدفع التي ندعمها (Stripe وPayPal) كوكيزها الخاصة لمعالجة المعاملات بأمان. تخضع هذه الكوكيز لسياسات الخصوصية الخاصة بكل مزود." : "The payment gateways we support (Stripe and PayPal) use their own cookies to process transactions securely. These cookies are governed by each provider's own privacy policies."}</p>
            </LegalSection>

            <LegalSection title={isAr ? "4. التحكم في الكوكيز" : "4. Cookie control"}>
              <p>{isAr ? "يمكنك التحكم في الكوكيز عبر إعدادات المتصفح. قد يؤدي تعطيل الكوكيز الضرورية إلى تعطيل وظائف أساسية في المنصة مثل تسجيل الدخول وإدارة الجلسة." : "You can control cookies through your browser settings. Disabling essential cookies may impair core platform functionality such as login and session management."}</p>
            </LegalSection>

            <LegalSection title={isAr ? "5. التعديلات" : "5. Changes"}>
              <p>{isAr ? "قد نحدّث هذه السياسة لتعكس التغييرات في الكوكيز التي نستخدمها. سنخطرك بالتغييرات الجوهرية عبر المنصة أو البريد الإلكتروني." : "We may update this policy to reflect changes in the cookies we use. We will notify you of material changes through the platform or by email."}</p>
            </LegalSection>

            <LegalSection title={isAr ? "6. التواصل" : "6. Contact"}>
              <p>{isAr ? "للاستفسار عن استخدامنا للكوكيز:" : "For queries about our use of cookies:"} {content.contact.email}</p>
            </LegalSection>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
