import { setRequestLocale } from "next-intl/server";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { getLaunchContent } from "@/lib/launch-content";

function LegalSection({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="border-b border-[rgba(4,141,254,0.08)] pb-10 last:border-0">
      <h2 className="mb-4 text-xl font-bold text-[#0a1628]">{title}</h2>
      <div className="space-y-3 text-[15px] leading-7 text-[#4a5e7a]">{children}</div>
    </div>
  );
}

export default async function TermsPage({
  params,
}: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);

  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;
  const isArabic = locale === "ar";

  return (
    <MarketingShell currentPath="/legal/terms" locale={locale}>
      <section className="border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] to-[#0054c5]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="section-label mb-4">{p.termsBadge}</p>
          <h1 className="text-4xl font-extrabold text-white">{p.termsTitle}</h1>
          <p className="mt-3 text-[#b3d4f5]">{p.lastUpdated}</p>
        </div>
      </section>

      <section className="bg-[#faf9f5] py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="space-y-10">
            {isArabic ? (
              <>
                <LegalSection title="1. قبول الشروط">
                  <p>
                    باستخدام منصة Hostinvo أو الوصول إليها، فإنك توافق على الالتزام بهذه
                    الشروط. إذا كنت تمثل شركة، فإنك تؤكد امتلاكك الصلاحية لقبول هذه
                    الشروط نيابة عنها.
                  </p>
                </LegalSection>

                <LegalSection title="2. وصف الخدمة">
                  <p>
                    Hostinvo منصة SaaS لأتمتة الاستضافة تتيح لمزودي الاستضافة إدارة
                    الفوترة والتزويد والعملاء والنطاقات والدعم الفني. الخدمة متاحة
                    باشتراك شهري وفق الباقة المختارة.
                  </p>
                </LegalSection>

                <LegalSection title="3. الحسابات والأمان">
                  <p>
                    أنت مسؤول عن الحفاظ على سرية بيانات تسجيل دخولك. يجب إخطارنا فورًا
                    بأي وصول غير مصرح به إلى حسابك. لا تتحمل Hostinvo المسؤولية عن
                    الخسائر الناتجة عن إهمالك في حماية بيانات الحساب.
                  </p>
                </LegalSection>

                <LegalSection title="4. الفوترة والدفع">
                  <p>
                    تُفوتر الاشتراكات مسبقًا على أساس شهري. الأسعار المعروضة بالدولار
                    الأمريكي وقابلة للتغيير مع إشعار مسبق. في حالة التأخر في السداد،
                    قد يتم تعليق الخدمة بعد إشعارك.
                  </p>
                  <p>لا تُسترد الرسوم المدفوعة عن الأشهر المنتهية.</p>
                </LegalSection>

                <LegalSection title="5. الاستخدام المقبول">
                  <p>
                    يُحظر استخدام المنصة لأغراض غير مشروعة أو لإرسال رسائل مزعجة أو
                    لانتهاك حقوق الملكية الفكرية لأطراف ثالثة أو بأي طريقة تضر
                    بالمنصة أو مستخدميها الآخرين.
                  </p>
                </LegalSection>

                <LegalSection title="6. ملكية البيانات">
                  <p>
                    تبقى البيانات التي تُدخلها على المنصة ملكًا لك. نمنحك ترخيصًا
                    لاستخدام المنصة لمعالجة هذه البيانات، ولا نطالب بأي حقوق ملكية
                    على محتوى حسابك.
                  </p>
                </LegalSection>

                <LegalSection title="7. توقف الخدمة وإنهاؤها">
                  <p>
                    يمكنك إنهاء اشتراكك في أي وقت. تحتفظ Hostinvo بالحق في تعليق أو
                    إنهاء الحسابات التي تنتهك هذه الشروط. عند الإنهاء، يتوقف وصولك إلى
                    المنصة مع انتهاء فترة الفوترة الحالية.
                  </p>
                </LegalSection>

                <LegalSection title="8. إخلاء المسؤولية">
                  <p>
                    تُقدَّم المنصة &quot;كما هي&quot; دون ضمانات صريحة أو ضمنية. لا
                    تضمن Hostinvo توفر الخدمة بشكل مستمر وغير منقطع، وإن كنا نسعى إلى
                    تحقيق مستوى عالٍ من الموثوقية.
                  </p>
                </LegalSection>

                <LegalSection title="9. تحديد المسؤولية">
                  <p>
                    لا تتجاوز مسؤولية Hostinvo في أي حال المبلغ الذي دفعته مقابل
                    الخدمة خلال الاثني عشر شهرًا السابقة للحادثة المُدَّعى بها.
                  </p>
                </LegalSection>

                <LegalSection title="10. التعديلات على الشروط">
                  <p>
                    نحتفظ بالحق في تعديل هذه الشروط. سنخطرك بالتغييرات الجوهرية قبل 14
                    يومًا على الأقل عبر البريد الإلكتروني. الاستمرار في استخدام المنصة
                    بعد سريان التعديلات يعني قبولها.
                  </p>
                </LegalSection>

                <LegalSection title="11. التواصل">
                  <p>للاستفسارات المتعلقة بهذه الشروط: {content.contact.email}</p>
                </LegalSection>
              </>
            ) : (
              <>
                <LegalSection title="1. Acceptance of terms">
                  <p>
                    By accessing or using the Hostinvo platform, you agree to be
                    bound by these Terms. If you represent a company, you confirm
                    your authority to accept these Terms on its behalf.
                  </p>
                </LegalSection>

                <LegalSection title="2. Service description">
                  <p>
                    Hostinvo is a hosting automation SaaS platform enabling hosting
                    providers to manage billing, provisioning, clients, domains, and
                    support. The service is available as a monthly subscription
                    based on your selected plan.
                  </p>
                </LegalSection>

                <LegalSection title="3. Accounts and security">
                  <p>
                    You are responsible for maintaining the confidentiality of your
                    login credentials. You must notify us immediately of any
                    unauthorised access to your account. Hostinvo is not liable for
                    losses resulting from your failure to protect account
                    credentials.
                  </p>
                </LegalSection>

                <LegalSection title="4. Billing and payment">
                  <p>
                    Subscriptions are billed in advance on a monthly basis. Prices
                    are listed in USD and are subject to change with advance notice.
                    In the event of non-payment, service may be suspended following
                    notification.
                  </p>
                  <p>Fees paid for completed billing periods are non-refundable.</p>
                </LegalSection>

                <LegalSection title="5. Acceptable use">
                  <p>
                    You may not use the platform for unlawful purposes, to send
                    unsolicited messages, to infringe third-party intellectual
                    property rights, or in any way that damages the platform or its
                    other users.
                  </p>
                </LegalSection>

                <LegalSection title="6. Data ownership">
                  <p>
                    Data you input into the platform remains your property. We grant
                    you a licence to use the platform to process that data and make
                    no claim of ownership over your account content.
                  </p>
                </LegalSection>

                <LegalSection title="7. Service suspension and termination">
                  <p>
                    You may cancel your subscription at any time. Hostinvo reserves
                    the right to suspend or terminate accounts that violate these
                    Terms. Upon termination, your access ends at the conclusion of
                    the current billing period.
                  </p>
                </LegalSection>

                <LegalSection title="8. Disclaimer of warranties">
                  <p>
                    The platform is provided &quot;as is&quot; without express or
                    implied warranties. Hostinvo does not guarantee uninterrupted
                    availability of the service, though we strive to maintain a high
                    standard of reliability.
                  </p>
                </LegalSection>

                <LegalSection title="9. Limitation of liability">
                  <p>
                    In no event shall Hostinvo&apos;s liability exceed the amount you
                    paid for the service during the twelve months preceding the
                    claimed incident.
                  </p>
                </LegalSection>

                <LegalSection title="10. Changes to terms">
                  <p>
                    We reserve the right to modify these Terms. We will notify you
                    of material changes at least 14 days in advance by email.
                    Continued use of the platform after changes take effect
                    constitutes acceptance.
                  </p>
                </LegalSection>

                <LegalSection title="11. Contact">
                  <p>For enquiries regarding these Terms: {content.contact.email}</p>
                </LegalSection>
              </>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
