"use client";

import { useState, useTransition } from "react";

import {
  updateTenantPaymentGatewaySettings,
  type TenantPaymentGatewaySettingsRecord,
} from "@/lib/payment-settings";

type PaymentGatewaySettingsPanelProps = {
  locale: string;
  initialSettings: TenantPaymentGatewaySettingsRecord;
};

export function PaymentGatewaySettingsPanel({
  locale,
  initialSettings,
}: PaymentGatewaySettingsPanelProps) {
  const isArabic = locale === "ar";
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const copy = {
    intro: isArabic
      ? "أدر بوابات الدفع الخاصة بالمستأجر. يتم حفظ مفاتيح Stripe وPayPal داخل إعدادات المستأجر وتستخدم مباشرة في مسار سداد الفواتير."
      : "Manage tenant payment gateways. Stripe and PayPal credentials are stored in tenant settings and used directly by the invoice payment flow.",
    save: isArabic ? "حفظ الإعدادات" : "Save settings",
    saving: isArabic ? "جارٍ الحفظ..." : "Saving...",
    saved: isArabic ? "تم تحديث إعدادات بوابات الدفع." : "Payment gateway settings were updated.",
    serviceUnavailable: isArabic ? "الخدمة غير متاحة حالياً." : "Service unavailable.",
    stripe: isArabic ? "Stripe" : "Stripe",
    paypal: isArabic ? "PayPal" : "PayPal",
    manual: isArabic ? "Manual" : "Manual",
    enabled: isArabic ? "مفعل" : "Enabled",
    publishableKey: isArabic ? "Publishable key" : "Publishable key",
    secretKey: isArabic ? "Secret key" : "Secret key",
    webhookSecret: isArabic ? "Webhook secret" : "Webhook secret",
    clientId: isArabic ? "Client ID" : "Client ID",
    clientSecret: isArabic ? "Client secret" : "Client secret",
    webhookId: isArabic ? "Webhook ID" : "Webhook ID",
    mode: isArabic ? "Mode" : "Mode",
    sandbox: isArabic ? "Sandbox" : "Sandbox",
    live: isArabic ? "Live" : "Live",
    instructions: isArabic ? "Manual payment instructions" : "Manual payment instructions",
  };

  const inputClass =
    "w-full rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 text-sm outline-none transition focus:border-accent";
  const checkboxClass = "h-4 w-4 rounded border-line accent-accent";

  function save() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateTenantPaymentGatewaySettings(settings);

      if (!result.data) {
        setError(result.error ?? copy.serviceUnavailable);
        return;
      }

      setSettings(result.data);
      setSuccess(copy.saved);
    });
  }

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <p className="max-w-3xl text-sm leading-7 text-muted">{copy.intro}</p>
          <button
            className="btn-primary whitespace-nowrap disabled:opacity-60"
            disabled={isPending}
            onClick={save}
            type="button"
          >
            {isPending ? copy.saving : copy.save}
          </button>
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-foreground">{copy.stripe}</h2>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  checked={settings.stripe.enabled}
                  className={checkboxClass}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      stripe: { ...current.stripe, enabled: event.target.checked },
                    }))
                  }
                  type="checkbox"
                />
                <span>{copy.enabled}</span>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>{copy.publishableKey}</span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      stripe: { ...current.stripe, publishable_key: event.target.value },
                    }))
                  }
                  value={settings.stripe.publishable_key}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>{copy.secretKey}</span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      stripe: { ...current.stripe, secret_key: event.target.value },
                    }))
                  }
                  value={settings.stripe.secret_key}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                <span>{copy.webhookSecret}</span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      stripe: { ...current.stripe, webhook_secret: event.target.value },
                    }))
                  }
                  value={settings.stripe.webhook_secret}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 border-t border-line pt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-foreground">{copy.paypal}</h2>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  checked={settings.paypal.enabled}
                  className={checkboxClass}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      paypal: { ...current.paypal, enabled: event.target.checked },
                    }))
                  }
                  type="checkbox"
                />
                <span>{copy.enabled}</span>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>{copy.clientId}</span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      paypal: { ...current.paypal, client_id: event.target.value },
                    }))
                  }
                  value={settings.paypal.client_id}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>{copy.clientSecret}</span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      paypal: { ...current.paypal, client_secret: event.target.value },
                    }))
                  }
                  value={settings.paypal.client_secret}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>{copy.webhookId}</span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      paypal: { ...current.paypal, webhook_id: event.target.value },
                    }))
                  }
                  value={settings.paypal.webhook_id}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>{copy.mode}</span>
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      paypal: {
                        ...current.paypal,
                        mode: event.target.value as "sandbox" | "live",
                      },
                    }))
                  }
                  value={settings.paypal.mode}
                >
                  <option value="sandbox">{copy.sandbox}</option>
                  <option value="live">{copy.live}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="grid gap-4 border-t border-line pt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-foreground">{copy.manual}</h2>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  checked={settings.manual.enabled}
                  className={checkboxClass}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      manual: { ...current.manual, enabled: event.target.checked },
                    }))
                  }
                  type="checkbox"
                />
                <span>{copy.enabled}</span>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.instructions}</span>
              <textarea
                className={`${inputClass} min-h-[160px]`}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    manual: { ...current.manual, instructions: event.target.value },
                  }))
                }
                value={settings.manual.instructions}
              />
            </label>
          </div>
        </div>

        {error ? <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}
      </section>
    </div>
  );
}
