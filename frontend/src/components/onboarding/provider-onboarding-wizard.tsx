"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { siCpanel, siLinux, siPlesk } from "simple-icons";

import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { type AppLocale } from "@/i18n/routing";
import { fetchAuthConfig, type AuthConfigResponse } from "@/lib/auth-security";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";
import {
  fetchOnboardingStatus,
  registerProvider,
  type OnboardingStatusPayload,
  updateOnboardingCompany,
} from "@/lib/onboarding";

type ProviderOnboardingWizardProps = { locale: AppLocale };

type Copy = {
  intro: string;
  login: string;
  progress: string;
  stepLabel: string;
  included: string;
  support: string;
  supportBody: string;
  complete: string;
  createTitle: string;
  createBody: string;
  configureTitle: string;
  configureBody: string;
  serverTitle: string;
  serverBody: string;
  productTitle: string;
  productBody: string;
  hint: string;
  unauthenticated: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  companyName: string;
  companyNamePlaceholder: string;
  companyDomain: string;
  companyDomainPlaceholder: string;
  licenseToggle: string;
  licenseHelp: string;
  licenseKey: string;
  licenseKeyPlaceholder: string;
  licenseInstance: string;
  licenseInstancePlaceholder: string;
  currency: string;
  currencyPlaceholder: string;
  timezone: string;
  timezonePlaceholder: string;
  createSubmit: string;
  configureSubmit: string;
  refresh: string;
  openServers: string;
  openProducts: string;
  success: string;
  error: string;
  items: Array<{ key: string; title: string; body: string }>;
};

const copyByLocale: Record<AppLocale, Copy> = {
  en: {
    intro:
      "Create your self-hosted Hostinvo installation, activate a paid license or start a 7-day evaluation license, and prepare the first provider workspace.",
    login: "Sign in instead",
    progress: "Setup progress",
    stepLabel: "Step",
    included: "What's included",
    support: "Built for serious providers",
    supportBody:
      "Hostinvo gives you billing, provisioning, domains, and support operations inside one self-hosted provider control layer.",
    complete: "of 4 complete",
    createTitle: "Create your account",
    createBody:
      "Create the provider owner account. If you already purchased a Hostinvo license, activate it now. Otherwise, a 7-day trial license with up to 3 clients will be issued for evaluation.",
    configureTitle: "Configure your company",
    configureBody:
      "Confirm your brand profile and operating defaults before connecting infrastructure.",
    serverTitle: "Add your first server",
    serverBody:
      "Connect your first cPanel or Plesk node before enabling production services.",
    productTitle: "Create your first product",
    productBody:
      "Define the first hosting offer and pricing model for your commercial launch.",
    hint: "Already have an account?",
    unauthenticated:
      "Sign in or create a provider account to continue onboarding.",
    name: "Full name",
    namePlaceholder: "Jane Smith",
    email: "Email address",
    emailPlaceholder: "jane@provider.com",
    password: "Password",
    passwordPlaceholder: "Create a secure password",
    confirmPassword: "Confirm password",
    confirmPasswordPlaceholder: "Repeat your password",
    companyName: "Company name",
    companyNamePlaceholder: "Acme Hosting Ltd",
    companyDomain: "Company domain",
    companyDomainPlaceholder: "acmehosting.com",
    licenseToggle: "Have a license key? (optional)",
    licenseHelp:
      "No license key yet? Hostinvo will issue a 7-day self-hosted trial for evaluation, limited to 3 clients.",
    licenseKey: "License key",
    licenseKeyPlaceholder: "HOST-XXXX-XXXX-XXXX",
    licenseInstance: "Instance ID",
    licenseInstancePlaceholder: "provider-instance-1",
    currency: "Default currency",
    currencyPlaceholder: "USD",
    timezone: "Timezone",
    timezonePlaceholder: "UTC",
    createSubmit: "Create provider account",
    configureSubmit: "Save company settings",
    refresh: "Refresh status",
    openServers: "Open server setup",
    openProducts: "Open product setup",
    success: "Saved successfully.",
    error: "Request failed.",
    items: [
      {
        key: "billing",
        title: "Automated billing",
        body: "Recurring invoices, gateway collection, credits, and reminders.",
      },
      {
        key: "provisioning",
        title: "Server provisioning",
        body: "Queue-backed infrastructure workflows for cPanel and Plesk.",
      },
      {
        key: "domains",
        title: "Domain management",
        body: "Lifecycle tracking for registrations, renewals, and contacts.",
      },
      {
        key: "support",
        title: "Client support",
        body: "Integrated tickets, internal notes, and provider operations.",
      },
    ],
  },
  ar: {
    intro:
      "أنشئ تثبيت Hostinvo الذاتي، وفعّل ترخيصًا مدفوعًا أو ابدأ تجربة تقييم لمدة 7 أيام، ثم جهّز أول مساحة عمل للمزوّد.",
    login: "تسجيل الدخول بدلاً من ذلك",
    progress: "تقدم الإعداد",
    stepLabel: "الخطوة",
    included: "ما الذي ستحصل عليه",
    support: "مصمم لمزودي الخدمة الجادين",
    supportBody:
      "يوفر Hostinvo طبقة تشغيل ذاتية للفوترة والتزويد والنطاقات والدعم داخل تجربة مزود احترافية.",
    complete: "من 4 مكتملة",
    createTitle: "إنشاء حسابك",
    createBody:
      "أنشئ حساب مالك المزود. إذا كان لديك ترخيص Hostinvo مدفوع فيمكنك تفعيله الآن، وإلا سيتم إصدار تجربة ذاتية لمدة 7 أيام بحد أقصى 3 عملاء للتقييم.",
    configureTitle: "إعداد شركتك",
    configureBody:
      "أكد هوية الشركة والإعدادات التشغيلية قبل ربط البنية التحتية.",
    serverTitle: "إضافة أول خادم",
    serverBody: "اربط أول خادم cPanel أو Plesk قبل تفعيل الخدمات الإنتاجية.",
    productTitle: "إنشاء أول منتج",
    productBody: "حدد أول عرض استضافة ونموذج التسعير من أجل الإطلاق التجاري.",
    hint: "لديك حساب بالفعل؟",
    unauthenticated: "سجل الدخول أو أنشئ حساب مزود خدمة لمتابعة الإعداد.",
    name: "الاسم الكامل",
    namePlaceholder: "محمد أحمد",
    email: "البريد الإلكتروني",
    emailPlaceholder: "jane@provider.com",
    password: "كلمة المرور",
    passwordPlaceholder: "أنشئ كلمة مرور آمنة",
    confirmPassword: "تأكيد كلمة المرور",
    confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
    companyName: "اسم الشركة",
    companyNamePlaceholder: "شركة أكمي للاستضافة",
    companyDomain: "نطاق الشركة",
    companyDomainPlaceholder: "acmehosting.com",
    licenseToggle: "هل لديك مفتاح ترخيص؟ (اختياري)",
    licenseHelp:
      "إذا لم يكن لديك مفتاح ترخيص بعد، سيُصدر Hostinvo تجربة ذاتية لمدة 7 أيام للتقييم وبحد أقصى 3 عملاء.",
    licenseKey: "مفتاح الترخيص",
    licenseKeyPlaceholder: "HOST-XXXX-XXXX-XXXX",
    licenseInstance: "معرف النسخة",
    licenseInstancePlaceholder: "provider-instance-1",
    currency: "العملة الافتراضية",
    currencyPlaceholder: "USD",
    timezone: "المنطقة الزمنية",
    timezonePlaceholder: "Asia/Riyadh",
    createSubmit: "إنشاء حساب المزود",
    configureSubmit: "حفظ إعدادات الشركة",
    refresh: "تحديث الحالة",
    openServers: "فتح إعداد الخوادم",
    openProducts: "فتح إعداد المنتجات",
    success: "تم الحفظ بنجاح.",
    error: "تعذر تنفيذ الطلب.",
    items: [
      {
        key: "billing",
        title: "فوترة تلقائية",
        body: "فواتير متكررة وتحصيل عبر البوابات وأرصدة وتذكيرات.",
      },
      {
        key: "provisioning",
        title: "تزويد الخوادم",
        body: "مسارات عمل مدعومة بالطوابير لخوادم cPanel وPlesk.",
      },
      {
        key: "domains",
        title: "إدارة النطاقات",
        body: "تتبع كامل للتسجيلات والتجديدات وجهات الاتصال.",
      },
      {
        key: "support",
        title: "دعم العملاء",
        body: "نظام تذاكر مدمج وملاحظات داخلية وتشغيل دعم احترافي.",
      },
    ],
  },
};

const card =
  "rounded-[1.75rem] border border-[#d7e5f4] bg-[#faf9f5]/95 shadow-[0_24px_60px_rgba(8,55,120,0.08)]";
const input =
  "w-full rounded-[1rem] border border-[#d0e1f3] bg-[#f8fbff] px-4 py-3.5 text-sm text-[#0a1628] outline-none transition placeholder:text-[#8ca6c1] focus:border-[#048dfe] focus:bg-[#faf9f5] focus:ring-4 focus:ring-[rgba(4,141,254,0.12)]";
const primary =
  "inline-flex items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#048DFE_0%,#036DEB_52%,#0054C5_100%)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(4,109,235,0.26)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60";
const secondary =
  "inline-flex items-center justify-center rounded-[1rem] border border-[#d0e1f3] bg-[#faf9f5] px-5 py-3.5 text-sm font-semibold text-[#244465] transition hover:bg-[#eff6ff]";

function resolveCurrentStep(status: OnboardingStatusPayload | null): number {
  if (!status) return 1;
  const index = status.steps.findIndex((step) => !step.complete);
  return index === -1 ? 4 : index + 1;
}

function CompatibilityLogo({
  platform,
}: {
  platform: "cpanel" | "plesk" | "linux";
}) {
  const icon =
    platform === "cpanel" ? siCpanel : platform === "plesk" ? siPlesk : siLinux;
  const badgeClass =
    platform === "cpanel"
      ? "bg-[linear-gradient(135deg,#fff1e8,#fff8f4)]"
      : platform === "plesk"
        ? "bg-[linear-gradient(135deg,#eef5ff,#f8fbff)]"
        : "bg-[linear-gradient(135deg,#f4f7fb,#fcfdff)]";
  const brandClass =
    platform === "cpanel"
      ? "text-[#FF6C2C]"
      : platform === "plesk"
        ? "text-[#0057D8]"
        : "text-[#0a1628]";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[#dbe8f7] shadow-[0_12px_28px_rgba(8,55,120,0.08)] ${badgeClass}`}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          role="img"
          aria-label={icon.title}
          fill={`#${icon.hex}`}
        >
          <path d={icon.path} />
        </svg>
      </div>
      <div className={`text-xl font-semibold tracking-[-0.03em] ${brandClass}`}>
        {platform === "cpanel"
          ? "cPanel"
          : platform === "plesk"
            ? "Plesk"
            : "Linux"}
      </div>
    </div>
  );
}

export function ProviderOnboardingWizard({
  locale,
}: ProviderOnboardingWizardProps) {
  const copy = copyByLocale[locale];
  const launchContent = getLaunchContent(locale);
  const labels = launchContent.onboarding.stepLabels;
  const compatibility =
    locale === "ar"
      ? {
          label: "الميزات المتوافقة",
          title: "ابدأ على البيئة التي يعمل عليها فريقك بالفعل",
          description:
            "صُمم Hostinvo لمزودي الخدمة الذين يديرون cPanel وPlesk وبنية استضافة مبنية على Linux منذ اليوم الأول.",
          platforms: [
            {
              key: "cpanel" as const,
              label: "cPanel / WHM",
              description:
                "هيئ حسابات الاستضافة المشتركة ونفذ عمليات دورة الحياة من خلال أتمتة cPanel المألوفة.",
            },
            {
              key: "plesk" as const,
              label: "Plesk",
              description:
                "اربط بيئات Plesk على Linux أو Windows مع إدارة خدمات قائمة على الخطط والباقات.",
            },
            {
              key: "linux" as const,
              label: "Linux",
              description:
                "شغّل المنصة على بنية Linux للمزودين مع Docker والطوابير والخدمات الجاهزة للإنتاج.",
            },
          ],
        }
      : {
          label: "Compatible features",
          title: "Deploy on the stack your team already trusts",
          description:
            "Hostinvo is designed for providers running cPanel, Plesk, and Linux-based hosting infrastructure from day one.",
          platforms: [
            {
              key: "cpanel" as const,
              label: "cPanel / WHM",
              description:
                "Provision shared-hosting accounts and manage lifecycle actions through familiar cPanel automation.",
            },
            {
              key: "plesk" as const,
              label: "Plesk",
              description:
                "Connect Windows or Linux-ready Plesk environments with package-driven service orchestration.",
            },
            {
              key: "linux" as const,
              label: "Linux",
              description:
                "Run on Linux-based provider infrastructure with Docker, queue workers, and production-ready services.",
            },
          ],
        };
  const isRtl = locale === "ar";
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<OnboardingStatusPayload | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLicense, setShowLicense] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    companyName: "",
    companyDomain: "",
    licenseKey: "",
    licenseInstance: "",
  });
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    companyDomain: "",
    defaultCurrency: "USD",
    timezone: "UTC",
  });
  const [authConfig, setAuthConfig] = useState<AuthConfigResponse | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  const completed = status
    ? status.steps.filter((step) => step.complete).length
    : 0;
  const isAuthenticated = status !== null;

  function syncCompany(nextStatus: OnboardingStatusPayload) {
    setCompanyForm({
      companyName: nextStatus.tenant.name ?? "",
      companyDomain: nextStatus.tenant.primary_domain ?? "",
      defaultCurrency: nextStatus.tenant.default_currency ?? "USD",
      timezone: nextStatus.tenant.timezone ?? "UTC",
    });
  }

  const refreshStatus = useCallback(() => {
    setStatusError(null);
    startTransition(async () => {
      const response = await fetchOnboardingStatus();
      if (!response.ok) {
        if (response.message === "unauthenticated") {
          setStatus(null);
          setCurrentStep(1);
          return;
        }
        setStatusError(response.message ?? copy.error);
        return;
      }
      if (!response.status) return;
      setStatus(response.status);
      syncCompany(response.status);
      setCurrentStep(resolveCurrentStep(response.status));
    });
  }, [copy.error]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    fetchAuthConfig().then((config) => setAuthConfig(config));
  }, []);

  function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const host =
      typeof window !== "undefined"
        ? window.location.hostname
        : registerForm.companyDomain;
    startTransition(async () => {
      const response = await registerProvider({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        password_confirmation: registerForm.passwordConfirmation,
        company_name: registerForm.companyName,
        company_domain: registerForm.companyDomain || undefined,
        default_locale: locale,
        default_currency: companyForm.defaultCurrency || "USD",
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          companyForm.timezone ||
          "UTC",
        license_key: registerForm.licenseKey || undefined,
        license_domain:
          registerForm.licenseKey && (registerForm.companyDomain || host)
            ? registerForm.companyDomain || host
            : undefined,
        license_instance_id:
          registerForm.licenseKey && registerForm.licenseInstance
            ? registerForm.licenseInstance
            : registerForm.licenseKey
              ? "provider-instance-1"
              : undefined,
        turnstile_token: turnstileToken || undefined,
      });
      if (!response.ok) {
        setError(response.message ?? copy.error);
        return;
      }
      setMessage(copy.success);
      refreshStatus();
      setCurrentStep(2);
    });
  }

  function submitCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await updateOnboardingCompany({
        company_name: companyForm.companyName,
        company_domain: companyForm.companyDomain,
        default_locale: locale,
        default_currency: companyForm.defaultCurrency,
        timezone: companyForm.timezone,
      });
      if (!response.ok) {
        setError(response.message ?? copy.error);
        return;
      }
      setMessage(copy.success);
      refreshStatus();
    });
  }

  const stepTitle =
    currentStep === 1
      ? copy.createTitle
      : currentStep === 2
        ? copy.configureTitle
        : currentStep === 3
          ? copy.serverTitle
          : copy.productTitle;
  const stepBody =
    currentStep === 1
      ? copy.createBody
      : currentStep === 2
        ? copy.configureBody
        : currentStep === 3
          ? copy.serverBody
          : copy.productBody;

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(4,141,254,0.12),transparent_24rem),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] text-[#0a1628]"
    >
      <header className="border-b border-[#dbe8f7] bg-[#faf9f5]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-6 px-6 py-5 sm:px-8 xl:px-10">
          <BrandLogo
            href={`/${locale}`}
            priority
            className="block w-full max-w-[12rem]"
          />
          <div className="flex items-center gap-4">
            <LocaleSwitcher currentLocale={locale} path="/onboarding" />
            {!isAuthenticated ? (
              <Link
                href={localePath(locale, "/auth/login")}
                className="text-sm font-semibold text-[#33506f] transition hover:text-[#036deb]"
              >
                {copy.login}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className="border-b border-[#dfeaf7] bg-[#faf9f5]/70">
        <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-5 px-6 py-7 sm:px-8 xl:px-10">
          <p className="max-w-3xl text-[15px] leading-7 text-[#526c88]">
            {copy.intro}
          </p>
          <div className="grid gap-4 lg:grid-cols-4">
            {labels.map((label, index) => {
              const step = index + 1;
              const done = status?.steps[index]?.complete ?? false;
              const active = currentStep === step;
              return (
                <div
                  key={label}
                  className={`${active ? "border-[#a6d5ff] bg-[#faf9f5] shadow-[0_18px_40px_rgba(4,109,235,0.08)]" : "border-[#deebf8] bg-[#faf9f5]/70"} flex items-center gap-4 rounded-[1.5rem] border px-4 py-4 transition`}
                >
                  <div
                    className={`${done ? "bg-[#048dfe] text-white" : active ? "bg-[linear-gradient(135deg,#048DFE,#036DEB)] text-white" : "bg-[#e7f0fa] text-[#6d88a9]"} flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold`}
                  >
                    {done ? "✓" : step}
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.2em] text-[#7c95b2]">
                      {copy.stepLabel} {step}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#0a1628]">
                      {label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-[88rem] gap-7 px-6 py-8 sm:px-8 xl:grid-cols-[minmax(0,1.14fr)_21rem] xl:items-start xl:px-10">
        <div className="grid gap-7 self-start">
          <section className={`${card} self-start p-6 sm:p-8`}>
            {message ? (
              <div className="mb-5 rounded-[1rem] border border-[#ccebd8] bg-[#f2fbf6] px-4 py-3 text-sm leading-6 text-[#1f7a46]">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="mb-5 rounded-[1rem] border border-[#ffd5d2] bg-[#fff4f3] px-4 py-3 text-sm leading-6 text-[#b7382d]">
                {error}
              </div>
            ) : null}
            <div className="border-b border-[#e3edf8] pb-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#cfe0f4] bg-[#f8fbff] px-3 py-2 text-sm font-medium text-[#4e6782]">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#048DFE,#036DEB)] text-sm font-semibold text-white">
                  {currentStep}
                </div>
                <span>{stepTitle}</span>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#57718e]">
                {stepBody}
              </p>
            </div>

            {currentStep === 1 ? (
              <div className="mt-6 grid gap-5">
                <div className="text-sm leading-7 text-[#5a738f]">
                  {copy.hint}{" "}
                  <Link
                    href={localePath(locale, "/auth/login")}
                    className="font-semibold text-[#036deb] transition hover:text-[#002d8e]"
                  >
                    {copy.login}
                  </Link>
                </div>
                <form onSubmit={submitCreate} className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-[#123055]">
                        {copy.name}
                      </label>
                      <input
                        className={input}
                        placeholder={copy.namePlaceholder}
                        value={registerForm.name}
                        onChange={(e) =>
                          setRegisterForm((v) => ({
                            ...v,
                            name: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-[#123055]">
                        {copy.email}
                      </label>
                      <input
                        className={input}
                        type="email"
                        placeholder={copy.emailPlaceholder}
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm((v) => ({
                            ...v,
                            email: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-[#123055]">
                        {copy.password}
                      </label>
                      <input
                        className={input}
                        type="password"
                        placeholder={copy.passwordPlaceholder}
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm((v) => ({
                            ...v,
                            password: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-[#123055]">
                        {copy.confirmPassword}
                      </label>
                      <input
                        className={input}
                        type="password"
                        placeholder={copy.confirmPasswordPlaceholder}
                        value={registerForm.passwordConfirmation}
                        onChange={(e) =>
                          setRegisterForm((v) => ({
                            ...v,
                            passwordConfirmation: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-[#123055]">
                        {copy.companyName}
                      </label>
                      <input
                        className={input}
                        placeholder={copy.companyNamePlaceholder}
                        value={registerForm.companyName}
                        onChange={(e) =>
                          setRegisterForm((v) => ({
                            ...v,
                            companyName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-[#123055]">
                        {copy.companyDomain}
                      </label>
                      <input
                        className={input}
                        placeholder={copy.companyDomainPlaceholder}
                        value={registerForm.companyDomain}
                        onChange={(e) =>
                          setRegisterForm((v) => ({
                            ...v,
                            companyDomain: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="rounded-[1.35rem] border border-[#dbe8f7] bg-[#f8fbff] p-4">
                    <button
                      type="button"
                      onClick={() => setShowLicense((value) => !value)}
                      className="flex w-full items-center justify-between gap-3 text-sm font-semibold text-[#264666]"
                    >
                      <span>{copy.licenseToggle}</span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d0e1f3] bg-[#faf9f5] text-[#036deb]">
                        {showLicense ? "−" : "+"}
                      </span>
                    </button>
                    <p className="mt-3 text-sm leading-6 text-[#58718c]">
                      {copy.licenseHelp}
                    </p>
                    {showLicense ? (
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <label className="text-sm font-semibold text-[#123055]">
                            {copy.licenseKey}
                          </label>
                          <input
                            className={input}
                            placeholder={copy.licenseKeyPlaceholder}
                            value={registerForm.licenseKey}
                            onChange={(e) =>
                              setRegisterForm((v) => ({
                                ...v,
                                licenseKey: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-semibold text-[#123055]">
                            {copy.licenseInstance}
                          </label>
                          <input
                            className={input}
                            placeholder={copy.licenseInstancePlaceholder}
                            value={registerForm.licenseInstance}
                            onChange={(e) =>
                              setRegisterForm((v) => ({
                                ...v,
                                licenseInstance: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {currentStep === 1 &&
                  authConfig?.turnstile.enabled &&
                  authConfig.turnstile.forms["provider_register"] ? (
                    <TurnstileWidget
                      locale={locale}
                      siteKey={authConfig.turnstile.site_key}
                      onTokenChange={setTurnstileToken}
                    />
                  ) : null}
                  <button
                    type="submit"
                    disabled={isPending}
                    className={`${primary} w-full`}
                  >
                    {isPending ? "..." : copy.createSubmit}
                  </button>
                </form>
                {!isAuthenticated ? (
                  <div className="rounded-[1rem] border border-[#d8e7f6] bg-[#f8fbff] px-4 py-3 text-sm leading-6 text-[#57718e]">
                    {copy.unauthenticated}
                  </div>
                ) : null}
              </div>
            ) : null}

            {currentStep === 2 ? (
              <form onSubmit={submitCompany} className="mt-6 grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-[#123055]">
                      {copy.companyName}
                    </label>
                    <input
                      className={input}
                      placeholder={copy.companyNamePlaceholder}
                      value={companyForm.companyName}
                      onChange={(e) =>
                        setCompanyForm((v) => ({
                          ...v,
                          companyName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-[#123055]">
                      {copy.companyDomain}
                    </label>
                    <input
                      className={input}
                      placeholder={copy.companyDomainPlaceholder}
                      value={companyForm.companyDomain}
                      onChange={(e) =>
                        setCompanyForm((v) => ({
                          ...v,
                          companyDomain: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-[#123055]">
                      {copy.currency}
                    </label>
                    <input
                      className={input}
                      placeholder={copy.currencyPlaceholder}
                      value={companyForm.defaultCurrency}
                      onChange={(e) =>
                        setCompanyForm((v) => ({
                          ...v,
                          defaultCurrency: e.target.value.toUpperCase(),
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-[#123055]">
                      {copy.timezone}
                    </label>
                    <input
                      className={input}
                      placeholder={copy.timezonePlaceholder}
                      value={companyForm.timezone}
                      onChange={(e) =>
                        setCompanyForm((v) => ({
                          ...v,
                          timezone: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isPending || !isAuthenticated}
                  className={`${primary} w-full`}
                >
                  {isPending ? "..." : copy.configureSubmit}
                </button>
              </form>
            ) : null}

            {currentStep === 3 ? (
              <div className="mt-6 grid gap-5">
                <div className="rounded-[1.35rem] border border-[#dbe8f7] bg-[#f8fbff] p-5 text-sm leading-7 text-[#57718e]">
                  {copy.serverBody}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={localePath(locale, "/dashboard/servers")}
                    className={primary}
                  >
                    {copy.openServers}
                  </Link>
                  <button
                    type="button"
                    onClick={refreshStatus}
                    className={secondary}
                  >
                    {copy.refresh}
                  </button>
                </div>
              </div>
            ) : null}
            {currentStep === 4 ? (
              <div className="mt-6 grid gap-5">
                <div className="rounded-[1.35rem] border border-[#dbe8f7] bg-[#f8fbff] p-5 text-sm leading-7 text-[#57718e]">
                  {copy.productBody}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={localePath(locale, "/dashboard/products/new")}
                    className={primary}
                  >
                    {copy.openProducts}
                  </Link>
                  <button
                    type="button"
                    onClick={refreshStatus}
                    className={secondary}
                  >
                    {copy.refresh}
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className={`${card} self-start overflow-hidden p-6 sm:p-8`}>
            <div className="grid gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:items-center">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#5f7ca5]">
                  {compatibility.label}
                </div>
                <h2 className="mt-4 max-w-xl text-[2rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[#0a1628]">
                  {compatibility.title}
                </h2>
                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#58718c]">
                  {compatibility.description}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {compatibility.platforms.map((platform) => (
                  <div
                    key={platform.key}
                    className="rounded-[1.5rem] border border-[#dce9f7] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,250,255,0.92))] p-5 shadow-[0_18px_40px_rgba(8,55,120,0.05)]"
                  >
                    <CompatibilityLogo platform={platform.key} />
                    <div className="mt-5 text-sm leading-7 text-[#58718c]">
                      {platform.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="grid gap-5 xl:sticky xl:top-8 xl:self-start">
          <div className={`${card} p-6`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#5f7ca5]">
              {copy.progress}
            </div>
            <div className="mt-5 grid gap-3">
              {labels.map((label, index) => {
                const step = index + 1;
                const done = status?.steps[index]?.complete ?? false;
                const active = currentStep === step;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className={`${done ? "bg-[#048dfe] text-white" : active ? "bg-[linear-gradient(135deg,#048DFE,#036DEB)] text-white" : "bg-[#e7f0fa] text-[#6d88a9]"} flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold`}
                    >
                      {done ? "✓" : step}
                    </div>
                    <div className="text-sm text-[#4d6783]">{label}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#7390af]">
                <span>
                  {completed} {copy.complete}
                </span>
                <span>{Math.round((completed / labels.length) * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e4eef8]">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(135deg,#048DFE,#036DEB)] transition-all duration-500"
                  style={{ width: `${(completed / labels.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className={`${card} p-6`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#5f7ca5]">
              {copy.included}
            </div>
            <div className="mt-5 grid gap-4">
              {copy.items.map((item) => (
                <div
                  key={item.key}
                  className="rounded-[1.25rem] border border-[#e4eef8] bg-[#f9fcff] p-4"
                >
                  <div className="text-sm font-semibold text-[#0a1628]">
                    {item.title}
                  </div>
                  <div className="mt-1.5 text-sm leading-6 text-[#58718c]">
                    {item.body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#cfe0f4] bg-[linear-gradient(180deg,#0f3f95_0%,#002d8e_100%)] p-6 text-white shadow-[0_24px_60px_rgba(0,45,142,0.24)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#bcdcff]">
              {copy.support}
            </div>
            <p className="mt-4 text-sm leading-7 text-[#d6e7ff]">
              {copy.supportBody}
            </p>
            {statusError ? (
              <div className="mt-5 rounded-[1rem] border border-white/10 bg-[#faf9f5]/10 px-4 py-3 text-sm text-[#eef6ff]">
                {statusError}
              </div>
            ) : null}
          </div>
        </aside>
      </main>

      <footer className="border-t border-[#dfeaf7] bg-[#faf9f5]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-8 px-6 py-8 sm:px-8 xl:px-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <BrandLogo
                href={`/${locale}`}
                className="block w-full max-w-[11rem]"
              />
              <p className="mt-4 text-sm leading-7 text-[#58718c]">
                {copy.supportBody}
              </p>
            </div>
            <nav className="flex flex-wrap gap-3 text-sm font-semibold text-[#365277]">
              <Link
                href={localePath(locale, "/features")}
                className="rounded-full border border-[#d8e7f6] bg-[#f8fbff] px-4 py-2 transition hover:border-[#bcd7f2] hover:bg-[#faf9f5] hover:text-[#036deb]"
              >
                {launchContent.nav.features}
              </Link>
              <Link
                href={localePath(locale, "/pricing")}
                className="rounded-full border border-[#d8e7f6] bg-[#f8fbff] px-4 py-2 transition hover:border-[#bcd7f2] hover:bg-[#faf9f5] hover:text-[#036deb]"
              >
                {launchContent.nav.pricing}
              </Link>
              <Link
                href={localePath(locale, "/documentation")}
                className="rounded-full border border-[#d8e7f6] bg-[#f8fbff] px-4 py-2 transition hover:border-[#bcd7f2] hover:bg-[#faf9f5] hover:text-[#036deb]"
              >
                {launchContent.nav.documentation}
              </Link>
              <Link
                href={localePath(locale, "/contact")}
                className="rounded-full border border-[#d8e7f6] bg-[#f8fbff] px-4 py-2 transition hover:border-[#bcd7f2] hover:bg-[#faf9f5] hover:text-[#036deb]"
              >
                {launchContent.nav.contact}
              </Link>
            </nav>
          </div>
          <div className="flex flex-col gap-2 border-t border-[#e3edf8] pt-5 text-sm text-[#7390af] lg:flex-row lg:items-center lg:justify-between">
            <span>{launchContent.footer.copyright}</span>
            <span>{launchContent.footer.techStack}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
