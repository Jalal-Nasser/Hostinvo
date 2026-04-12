"use client";

import { useState, useTransition } from "react";

import {
  updateTenantMfaPolicy,
  updateTenantTurnstile,
  type TenantMfaPolicyRecord,
  type TurnstileSettingsRecord,
} from "@/lib/security-settings";

type TenantSecuritySettingsPanelProps = {
  locale: string;
  initialMfaPolicy: TenantMfaPolicyRecord;
  initialTurnstile: TurnstileSettingsRecord;
};

export function TenantSecuritySettingsPanel({
  locale,
  initialMfaPolicy,
  initialTurnstile,
}: TenantSecuritySettingsPanelProps) {
  const isArabic = locale === "ar";
  const [isPending, startTransition] = useTransition();
  const [policy, setPolicy] = useState<TenantMfaPolicyRecord>(initialMfaPolicy);
  const [turnstile, setTurnstile] = useState<TurnstileSettingsRecord>(initialTurnstile);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySuccess, setPolicySuccess] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [turnstileSuccess, setTurnstileSuccess] = useState<string | null>(null);

  const copy = {
    pageIntro: isArabic
      ? "أدر سياسة المصادقة متعددة العوامل وإعدادات Cloudflare Turnstile الخاصة بمساحة العمل الحالية."
      : "Manage multi-factor authentication policy and Cloudflare Turnstile protection for the current tenant workspace.",
    mfaKicker: isArabic ? "سياسة المصادقة متعددة العوامل" : "Tenant MFA policy",
    mfaTitle: isArabic ? "إلزام مستخدمي المساحة بالمصادقة متعددة العوامل" : "Enforce MFA for workspace users",
    mfaDescription: isArabic
      ? "حدّد ما إذا كانت MFA معطلة أو اختيارية أو مطلوبة لمالكي المساحة والمديرين والموظفين والعملاء."
      : "Set whether MFA is disabled, optional, or required for owners/admins, staff users, and clients.",
    ownersAdmins: isArabic ? "المالكون والمديرون" : "Owners and admins",
    staff: isArabic ? "الموظفون" : "Staff users",
    clients: isArabic ? "العملاء" : "Clients",
    disabled: isArabic ? "معطل" : "Disabled",
    optional: isArabic ? "اختياري" : "Optional",
    required: isArabic ? "مطلوب" : "Required",
    policyNote: isArabic
      ? "عند ضبط أي نطاق على «مطلوب»، سيُطلب من المستخدمين في هذا النطاق إكمال TOTP أو التحقق به بعد كلمة المرور. وضع «اختياري» يطلب MFA فقط من المستخدمين الذين فعّلوه مسبقاً."
      : "When a scope is set to required, users in that scope must complete TOTP setup or verification after password login. Optional only prompts users who already have MFA enabled.",
    savePolicy: isArabic ? "حفظ سياسة MFA" : "Save MFA policy",
    savingPolicy: isArabic ? "جارٍ حفظ السياسة..." : "Saving policy...",
    policySaved: isArabic ? "تم تحديث سياسة MFA للمساحة." : "Tenant MFA policy was updated.",
    turnstileKicker: isArabic ? "حماية النماذج" : "Form protection",
    turnstileTitle: isArabic ? "حماية نماذج البوابة الخاصة بالمستأجر" : "Protect tenant-facing forms",
    turnstileDescription: isArabic
      ? "فعّل مفاتيح Turnstile الخاصة بالمستأجر واستخدمها في تسجيل دخول العملاء واستعادة كلمة المرور وإنشاء التذاكر."
      : "Enable tenant-owned Turnstile keys for client login, password recovery, and support request flows.",
    enabled: isArabic ? "تفعيل Turnstile لهذا المستأجر" : "Enable Turnstile for this tenant",
    useCustomKeys: isArabic ? "استخدام مفاتيح المستأجر بدلاً من مفاتيح المنصة" : "Use tenant keys instead of platform keys",
    siteKey: isArabic ? "مفتاح الموقع" : "Site key",
    secretKey: isArabic ? "المفتاح السري" : "Secret key",
    clientLogin: isArabic ? "تسجيل دخول العملاء" : "Client login",
    forgotPassword: isArabic ? "نسيت كلمة المرور" : "Forgot password",
    resetPassword: isArabic ? "إعادة تعيين كلمة المرور" : "Reset password",
    supportRequests: isArabic ? "تذاكر الدعم والطلبات" : "Support and ticket requests",
    fallbackNote: isArabic
      ? "عند تعطيل المفاتيح المخصصة، ستستخدم مساحة العمل إعدادات Turnstile الخاصة بالمنصة إذا كانت مفعلة."
      : "If tenant keys are disabled, the workspace falls back to platform Turnstile configuration where available.",
    saveTurnstile: isArabic ? "حفظ إعدادات Turnstile" : "Save Turnstile settings",
    savingTurnstile: isArabic ? "جارٍ حفظ Turnstile..." : "Saving Turnstile...",
    turnstileSaved: isArabic ? "تم تحديث إعدادات Turnstile للمساحة." : "Tenant Turnstile settings were updated.",
    serviceUnavailable: isArabic ? "الخدمة غير متاحة حالياً." : "Service unavailable.",
  };

  const selectClass =
    "w-full rounded-[1rem] border border-[#d9e3ef] bg-[#faf9f5] px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#048dfe] focus:ring-4 focus:ring-[rgba(4,141,254,0.12)]";
  const inputClass =
    "w-full rounded-[1rem] border border-[#d9e3ef] bg-[#faf9f5] px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#048dfe] focus:ring-4 focus:ring-[rgba(4,141,254,0.12)]";
  const checkboxClass =
    "h-4.5 w-4.5 rounded border-[#b9d0ea] text-[#048dfe] accent-[#048dfe]";

  function handlePolicySave() {
    setPolicyError(null);
    setPolicySuccess(null);

    startTransition(async () => {
      const result = await updateTenantMfaPolicy(policy);

      if (!result.data) {
        setPolicyError(result.error ?? copy.serviceUnavailable);
        return;
      }

      setPolicy(result.data);
      setPolicySuccess(copy.policySaved);
    });
  }

  function handleTurnstileSave() {
    setTurnstileError(null);
    setTurnstileSuccess(null);

    startTransition(async () => {
      const result = await updateTenantTurnstile(turnstile);

      if (!result.data) {
        setTurnstileError(result.error ?? copy.serviceUnavailable);
        return;
      }

      setTurnstile(result.data);
      setTurnstileSuccess(copy.turnstileSaved);
    });
  }

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <p className="text-sm leading-7 text-[#5f7389]">{copy.pageIntro}</p>
      </section>

      <section className="glass-card p-6 md:p-8">
        <p className="dashboard-kicker">{copy.mfaKicker}</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="grid gap-3">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
              {copy.mfaTitle}
            </h2>
            <p className="text-sm leading-7 text-[#5f7389]">{copy.mfaDescription}</p>
          </div>
          <button
            type="button"
            onClick={handlePolicySave}
            disabled={isPending}
            className="btn-primary whitespace-nowrap disabled:opacity-60"
          >
            {isPending ? copy.savingPolicy : copy.savePolicy}
          </button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-[#123055]">
            <span>{copy.ownersAdmins}</span>
            <select
              className={selectClass}
              value={policy.owner_admin}
              onChange={(event) =>
                setPolicy((current) => ({
                  ...current,
                  owner_admin: event.target.value as TenantMfaPolicyRecord["owner_admin"],
                }))
              }
            >
              <option value="disabled">{copy.disabled}</option>
              <option value="optional">{copy.optional}</option>
              <option value="required">{copy.required}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[#123055]">
            <span>{copy.staff}</span>
            <select
              className={selectClass}
              value={policy.staff}
              onChange={(event) =>
                setPolicy((current) => ({
                  ...current,
                  staff: event.target.value as TenantMfaPolicyRecord["staff"],
                }))
              }
            >
              <option value="disabled">{copy.disabled}</option>
              <option value="optional">{copy.optional}</option>
              <option value="required">{copy.required}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-[#123055]">
            <span>{copy.clients}</span>
            <select
              className={selectClass}
              value={policy.clients}
              onChange={(event) =>
                setPolicy((current) => ({
                  ...current,
                  clients: event.target.value as TenantMfaPolicyRecord["clients"],
                }))
              }
            >
              <option value="disabled">{copy.disabled}</option>
              <option value="optional">{copy.optional}</option>
              <option value="required">{copy.required}</option>
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-[#dce7f5] bg-[#f8fbff] px-4 py-4 text-sm leading-7 text-[#597086]">
          {copy.policyNote}
        </div>

        {policyError ? (
          <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {policyError}
          </p>
        ) : null}

        {policySuccess ? (
          <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {policySuccess}
          </p>
        ) : null}
      </section>

      <section className="glass-card p-6 md:p-8">
        <p className="dashboard-kicker">{copy.turnstileKicker}</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="grid gap-3">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
              {copy.turnstileTitle}
            </h2>
            <p className="text-sm leading-7 text-[#5f7389]">{copy.turnstileDescription}</p>
          </div>
          <button
            type="button"
            onClick={handleTurnstileSave}
            disabled={isPending}
            className="btn-primary whitespace-nowrap disabled:opacity-60"
          >
            {isPending ? copy.savingTurnstile : copy.saveTurnstile}
          </button>
        </div>

        <div className="mt-8 grid gap-4">
          <label className="flex items-center gap-3 text-sm font-medium text-[#123055]">
            <input
              type="checkbox"
              className={checkboxClass}
              checked={turnstile.enabled}
              onChange={(event) =>
                setTurnstile((current) => ({
                  ...current,
                  enabled: event.target.checked,
                }))
              }
            />
            <span>{copy.enabled}</span>
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-[#123055]">
            <input
              type="checkbox"
              className={checkboxClass}
              checked={turnstile.use_custom_keys ?? false}
              onChange={(event) =>
                setTurnstile((current) => ({
                  ...current,
                  use_custom_keys: event.target.checked,
                }))
              }
            />
            <span>{copy.useCustomKeys}</span>
          </label>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#123055]">
            <span>{copy.siteKey}</span>
            <input
              className={inputClass}
              value={turnstile.site_key}
              onChange={(event) =>
                setTurnstile((current) => ({
                  ...current,
                  site_key: event.target.value,
                }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[#123055]">
            <span>{copy.secretKey}</span>
            <input
              className={inputClass}
              value={turnstile.secret_key}
              onChange={(event) =>
                setTurnstile((current) => ({
                  ...current,
                  secret_key: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            { key: "client_login", label: copy.clientLogin },
            { key: "portal_forgot_password", label: copy.forgotPassword },
            { key: "portal_reset_password", label: copy.resetPassword },
            { key: "portal_support", label: copy.supportRequests },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-4 text-sm font-medium text-[#123055]"
            >
              <span>{item.label}</span>
              <input
                type="checkbox"
                className={checkboxClass}
                checked={Boolean(turnstile.forms[item.key])}
                onChange={(event) =>
                  setTurnstile((current) => ({
                    ...current,
                    forms: {
                      ...current.forms,
                      [item.key]: event.target.checked,
                    },
                  }))
                }
              />
            </label>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[#dce7f5] bg-[#f8fbff] px-4 py-4 text-sm leading-7 text-[#597086]">
          {copy.fallbackNote}
        </div>

        {turnstileError ? (
          <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {turnstileError}
          </p>
        ) : null}

        {turnstileSuccess ? (
          <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {turnstileSuccess}
          </p>
        ) : null}
      </section>
    </div>
  );
}
