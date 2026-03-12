"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";
import {
  fetchOnboardingStatus,
  registerProvider,
  updateOnboardingCompany,
  type OnboardingStatusPayload,
} from "@/lib/onboarding";
import { type AppLocale } from "@/i18n/routing";

type ProviderOnboardingWizardProps = {
  locale: AppLocale;
};

type LocalCopy = {
  statusTitle: string;
  statusDescription: string;
  unauthenticated: string;
  createAccountTitle: string;
  configureCompanyTitle: string;
  addServerTitle: string;
  createProductTitle: string;
  submitCreateAccount: string;
  submitConfigureCompany: string;
  refreshButton: string;
  companyName: string;
  companyDomain: string;
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  licenseKey: string;
  licenseInstance: string;
  timezone: string;
  defaultCurrency: string;
  stepCompleted: string;
  gotoServers: string;
  gotoProducts: string;
  success: string;
  error: string;
  loginLink: string;
};

const copyByLocale: Record<AppLocale, LocalCopy> = {
  en: {
    statusTitle: "Onboarding progress",
    statusDescription: "Complete each step to prepare your provider workspace for launch.",
    unauthenticated: "Sign in or create a provider account to continue onboarding.",
    createAccountTitle: "Step 1 - Create account",
    configureCompanyTitle: "Step 2 - Configure company",
    addServerTitle: "Step 3 - Add first server",
    createProductTitle: "Step 4 - Create first product",
    submitCreateAccount: "Create provider account",
    submitConfigureCompany: "Save company settings",
    refreshButton: "Refresh status",
    companyName: "Company name",
    companyDomain: "Company domain",
    name: "Owner name",
    email: "Owner email",
    password: "Password",
    passwordConfirmation: "Confirm password",
    licenseKey: "License key (optional)",
    licenseInstance: "Instance id (optional)",
    timezone: "Timezone",
    defaultCurrency: "Default currency",
    stepCompleted: "Completed",
    gotoServers: "Open server setup",
    gotoProducts: "Open product setup",
    success: "Saved successfully.",
    error: "Request failed.",
    loginLink: "Open login",
  },
  ar: {
    statusTitle: "تقدم الإعداد",
    statusDescription: "أكمل الخطوات التالية لتجهيز مساحة مزود الخدمة قبل الإطلاق.",
    unauthenticated: "سجل الدخول أو أنشئ حساب مزود خدمة للمتابعة.",
    createAccountTitle: "الخطوة 1 - إنشاء الحساب",
    configureCompanyTitle: "الخطوة 2 - إعداد الشركة",
    addServerTitle: "الخطوة 3 - إضافة أول خادم",
    createProductTitle: "الخطوة 4 - إنشاء أول منتج",
    submitCreateAccount: "إنشاء حساب المزود",
    submitConfigureCompany: "حفظ إعدادات الشركة",
    refreshButton: "تحديث الحالة",
    companyName: "اسم الشركة",
    companyDomain: "نطاق الشركة",
    name: "اسم المسؤول",
    email: "البريد الإلكتروني للمسؤول",
    password: "كلمة المرور",
    passwordConfirmation: "تأكيد كلمة المرور",
    licenseKey: "مفتاح الترخيص (اختياري)",
    licenseInstance: "معرف النسخة (اختياري)",
    timezone: "المنطقة الزمنية",
    defaultCurrency: "العملة الافتراضية",
    stepCompleted: "مكتملة",
    gotoServers: "فتح إعداد الخوادم",
    gotoProducts: "فتح إعداد المنتجات",
    success: "تم الحفظ بنجاح.",
    error: "تعذر تنفيذ الطلب.",
    loginLink: "فتح تسجيل الدخول",
  },
};

function resolveCurrentStep(status: OnboardingStatusPayload | null): number {
  if (!status) {
    return 1;
  }

  const firstIncompleteIndex = status.steps.findIndex((step) => !step.complete);

  return firstIncompleteIndex === -1 ? 4 : firstIncompleteIndex + 1;
}

export function ProviderOnboardingWizard({ locale }: ProviderOnboardingWizardProps) {
  const launchContent = getLaunchContent(locale);
  const copy = copyByLocale[locale];
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<OnboardingStatusPayload | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const isAuthenticated = status !== null;

  const stepLabels = useMemo(() => launchContent.onboarding.stepLabels, [launchContent]);

  function syncCompanyForm(nextStatus: OnboardingStatusPayload) {
    setCompanyForm({
      companyName: nextStatus.tenant.name ?? "",
      companyDomain: nextStatus.tenant.primary_domain ?? "",
      defaultCurrency: nextStatus.tenant.default_currency ?? "USD",
      timezone: nextStatus.tenant.timezone ?? "UTC",
    });
  }

  function refreshStatus() {
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

      if (!response.status) {
        return;
      }

      setStatus(response.status);
      syncCompanyForm(response.status);
      setCurrentStep(resolveCurrentStep(response.status));
    });
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const domainFromWindow =
      typeof window !== "undefined" ? window.location.hostname : registerForm.companyDomain;

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
          Intl.DateTimeFormat().resolvedOptions().timeZone || companyForm.timezone || "UTC",
        license_key: registerForm.licenseKey || undefined,
        license_domain:
          registerForm.licenseKey && (registerForm.companyDomain || domainFromWindow)
            ? registerForm.companyDomain || domainFromWindow
            : undefined,
        license_instance_id:
          registerForm.licenseKey && registerForm.licenseInstance
            ? registerForm.licenseInstance
            : registerForm.licenseKey
              ? "provider-instance-1"
              : undefined,
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

  function handleCompanySubmit(event: React.FormEvent<HTMLFormElement>) {
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

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{copy.statusTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{copy.statusDescription}</p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const completed = status?.steps[index]?.complete ?? false;
            const active = currentStep === stepNumber;

            return (
              <article
                key={label}
                className={[
                  "rounded-2xl border px-4 py-4",
                  completed
                    ? "border-emerald-300 bg-emerald-50/80"
                    : active
                      ? "border-accent bg-accentSoft"
                      : "border-line bg-white/80",
                ].join(" ")}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {stepNumber.toString().padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{label}</p>
                {completed ? <p className="mt-2 text-xs text-emerald-700">{copy.stepCompleted}</p> : null}
              </article>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={refreshStatus}
            disabled={isPending}
            className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft disabled:opacity-60"
          >
            {copy.refreshButton}
          </button>
          {!isAuthenticated ? (
            <Link
              href={localePath(locale, "/auth/login")}
              className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            >
              {copy.loginLink}
            </Link>
          ) : null}
        </div>
        {!isAuthenticated ? <p className="mt-4 text-sm text-muted">{copy.unauthenticated}</p> : null}
        {statusError ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {statusError}
          </p>
        ) : null}
      </section>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <h3 className="text-xl font-semibold text-foreground">{copy.createAccountTitle}</h3>
          <form className="mt-5 grid gap-3" onSubmit={handleRegisterSubmit}>
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.name}
              value={registerForm.name}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.email}
              type="email"
              value={registerForm.email}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.password}
              type="password"
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, password: event.target.value }))
              }
              required
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.passwordConfirmation}
              type="password"
              value={registerForm.passwordConfirmation}
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  passwordConfirmation: event.target.value,
                }))
              }
              required
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.companyName}
              value={registerForm.companyName}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, companyName: event.target.value }))
              }
              required
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.companyDomain}
              value={registerForm.companyDomain}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, companyDomain: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.licenseKey}
              value={registerForm.licenseKey}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, licenseKey: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.licenseInstance}
              value={registerForm.licenseInstance}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, licenseInstance: event.target.value }))
              }
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {copy.submitCreateAccount}
            </button>
          </form>
        </article>

        <article className="glass-card p-6 md:p-8">
          <h3 className="text-xl font-semibold text-foreground">{copy.configureCompanyTitle}</h3>
          <form className="mt-5 grid gap-3" onSubmit={handleCompanySubmit}>
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.companyName}
              value={companyForm.companyName}
              onChange={(event) =>
                setCompanyForm((current) => ({ ...current, companyName: event.target.value }))
              }
              required
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.companyDomain}
              value={companyForm.companyDomain}
              onChange={(event) =>
                setCompanyForm((current) => ({ ...current, companyDomain: event.target.value }))
              }
              required
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.defaultCurrency}
              value={companyForm.defaultCurrency}
              onChange={(event) =>
                setCompanyForm((current) => ({
                  ...current,
                  defaultCurrency: event.target.value.toUpperCase(),
                }))
              }
              required
            />
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-accent"
              placeholder={copy.timezone}
              value={companyForm.timezone}
              onChange={(event) =>
                setCompanyForm((current) => ({ ...current, timezone: event.target.value }))
              }
              required
            />
            <button
              type="submit"
              disabled={isPending || !isAuthenticated}
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {copy.submitConfigureCompany}
            </button>
          </form>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <h3 className="text-xl font-semibold text-foreground">{copy.addServerTitle}</h3>
          <p className="mt-3 text-sm leading-7 text-muted">
            Connect your first cPanel or Plesk server and verify access before activating services.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={localePath(locale, "/dashboard/servers")}
              className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            >
              {copy.gotoServers}
            </Link>
            <button
              type="button"
              onClick={refreshStatus}
              className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            >
              {copy.refreshButton}
            </button>
          </div>
        </article>

        <article className="glass-card p-6 md:p-8">
          <h3 className="text-xl font-semibold text-foreground">{copy.createProductTitle}</h3>
          <p className="mt-3 text-sm leading-7 text-muted">
            Create the first hosting product and pricing matrix to open your checkout flow.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={localePath(locale, "/dashboard/products/new")}
              className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            >
              {copy.gotoProducts}
            </Link>
            <button
              type="button"
              onClick={refreshStatus}
              className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            >
              {copy.refreshButton}
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
