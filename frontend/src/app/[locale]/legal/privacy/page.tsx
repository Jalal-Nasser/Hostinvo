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

export default async function PrivacyPage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;
  const isAr = locale === "ar";

  return (
    <MarketingShell currentPath="/legal/privacy" locale={locale}>
      <section className="border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] to-[#0054c5]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="section-label mb-4">{p.privacyBadge}</p>
          <h1 className="text-4xl font-extrabold text-white">{p.privacyTitle}</h1>
          <p className="mt-3 text-[#b3d4f5]">{p.lastUpdated}</p>
        </div>
      </section>

      <section className="bg-[#faf9f5] py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="space-y-10">
            {isAr ? (
              <>
                <LegalSection title="1. مقدمة"><p>تصف سياسة الخصوصية هذه كيفية جمع Hostinvo للمعلومات الشخصية واستخدامها وحمايتها عند استخدام منصتنا. باستخدام Hostinvo، فإنك توافق على الممارسات الموضحة في هذه السياسة.</p></LegalSection>
                <LegalSection title="2. البيانات التي نجمعها">
                  <p><strong className="text-[#0a1628]">بيانات الحساب:</strong> الاسم وعنوان البريد الإلكتروني وبيانات الشركة عند إنشاء حساب مزود.</p>
                  <p><strong className="text-[#0a1628]">بيانات الاستخدام:</strong> سجلات الوصول وعناوين IP والمتصفح المستخدم وأوقات الجلسات لأغراض الأمان والتشغيل.</p>
                  <p><strong className="text-[#0a1628]">بيانات الفوترة:</strong> نعالج مدفوعاتك عبر Stripe أو PayPal. لا نخزّن بيانات بطاقة الائتمان مباشرة على خوادمنا.</p>
                  <p><strong className="text-[#0a1628]">بيانات المستأجر:</strong> البيانات التي تُدخلها لإدارة عملائك وخدماتك وفواتيرك تبقى ملكاً لك وتُخزَّن بشكل معزول على مستوى المستأجر.</p>
                </LegalSection>
                <LegalSection title="3. كيف نستخدم بياناتك">
                  <p>نستخدم بياناتك لتقديم خدمات المنصة وتشغيلها وتحسينها، وإرسال إشعارات تتعلق بالخدمة، والرد على استفساراتك، وإدارة حسابك وفوترتك.</p>
                  <p>لا نبيع بياناتك الشخصية لأطراف ثالثة ولا نستخدمها لأغراض إعلانية.</p>
                </LegalSection>
                <LegalSection title="4. مشاركة البيانات">
                  <p>نشارك بياناتك فقط مع مزودي الخدمات الذين يساعدوننا في تشغيل المنصة (مثل Stripe وPayPal ومزودي الخوادم السحابية)، وعند الاقتضاء القانوني، أو بموافقتك الصريحة.</p>
                </LegalSection>
                <LegalSection title="5. أمان البيانات">
                  <p>نطبّق إجراءات أمنية تقنية وتنظيمية لحماية بياناتك، بما يشمل التشفير أثناء النقل وعزل بيانات المستأجرين على مستوى قاعدة البيانات.</p>
                </LegalSection>
                <LegalSection title="6. الاحتفاظ بالبيانات">
                  <p>نحتفظ ببيانات الحساب طوال مدة اشتراكك النشط. عند إنهاء الحساب، يمكنك طلب حذف بياناتك وفقاً لسياساتنا التشغيلية.</p>
                </LegalSection>
                <LegalSection title="7. حقوقك">
                  <p>يحق لك طلب الاطلاع على بياناتك الشخصية وتصحيحها أو حذفها. تواصل معنا على {content.contact.email} لممارسة هذه الحقوق.</p>
                </LegalSection>
                <LegalSection title="8. التعديلات">
                  <p>قد نحدّث هذه السياسة من وقت لآخر. سنخطرك بالتغييرات الجوهرية عبر البريد الإلكتروني أو من خلال المنصة.</p>
                </LegalSection>
                <LegalSection title="9. التواصل">
                  <p>لأي استفسار يتعلق بهذه السياسة، تواصل معنا على: {content.contact.email}</p>
                </LegalSection>
              </>
            ) : (
              <>
                <LegalSection title="1. Introduction"><p>This Privacy Policy describes how Hostinvo collects, uses, and protects your personal information when you use our platform. By using Hostinvo, you agree to the practices described in this policy.</p></LegalSection>
                <LegalSection title="2. Information we collect">
                  <p><strong className="text-[#0a1628]">Account data:</strong> Name, email address, and company information when you create a provider account.</p>
                  <p><strong className="text-[#0a1628]">Usage data:</strong> Access logs, IP addresses, browser information, and session timestamps for security and operational purposes.</p>
                  <p><strong className="text-[#0a1628]">Billing data:</strong> We process payments through Stripe or PayPal. We do not store credit card data directly on our servers.</p>
                  <p><strong className="text-[#0a1628]">Tenant data:</strong> Data you enter to manage your clients, services, and invoices remains your property and is stored with database-level tenant isolation.</p>
                </LegalSection>
                <LegalSection title="3. How we use your data">
                  <p>We use your data to provide, operate, and improve the platform, send service-related notifications, respond to your inquiries, and manage your account and billing.</p>
                  <p>We do not sell your personal data to third parties or use it for advertising purposes.</p>
                </LegalSection>
                <LegalSection title="4. Data sharing">
                  <p>We share your data only with service providers who help us operate the platform (such as Stripe, PayPal, and cloud infrastructure providers), when required by law, or with your explicit consent.</p>
                </LegalSection>
                <LegalSection title="5. Data security">
                  <p>We implement technical and organisational security measures to protect your data, including encryption in transit and database-level tenant data isolation.</p>
                </LegalSection>
                <LegalSection title="6. Data retention">
                  <p>We retain account data for the duration of your active subscription. Upon account termination, you may request deletion of your data in accordance with our operational policies.</p>
                </LegalSection>
                <LegalSection title="7. Your rights">
                  <p>You have the right to request access to, correction of, or deletion of your personal data. Contact us at {content.contact.email} to exercise these rights.</p>
                </LegalSection>
                <LegalSection title="8. Changes to this policy">
                  <p>We may update this policy from time to time. We will notify you of material changes by email or through the platform.</p>
                </LegalSection>
                <LegalSection title="9. Contact">
                  <p>For any questions about this policy, contact us at: {content.contact.email}</p>
                </LegalSection>
              </>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
