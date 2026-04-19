"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

import { StatusBanner } from "@/components/tenant-admin/status-banner";
import { Button } from "@/components/ui/button";
import { localePath } from "@/lib/auth";
import {
  createTenant,
  type TenantFormPayload,
  type TenantRecord,
  updateTenant,
} from "@/lib/tenants";

type TenantFormProps = {
  locale: string;
  mode: "create" | "edit";
  tenant?: TenantRecord;
};

export function TenantForm({ locale, mode, tenant }: TenantFormProps) {
  const t = useTranslations("Tenants");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TenantFormPayload>(() => ({
    name: tenant?.name ?? "",
    slug: tenant?.slug ?? "",
    primary_domain: tenant?.primary_domain ?? "",
    default_locale: tenant?.default_locale ?? "en",
    default_currency: tenant?.default_currency ?? "USD",
    timezone: tenant?.timezone ?? "UTC",
    owner_name: tenant?.owner?.name ?? "",
    owner_email: tenant?.owner?.email ?? "",
    owner_password: "",
    owner_password_confirmation: "",
  }));

  const isCreate = mode === "create";
  const submitLabel = useMemo(
    () =>
      isPending
        ? t("saving")
        : isCreate
          ? t("createTenantButton")
          : t("saveTenantButton"),
    [isCreate, isPending, t],
  );

  function generatePassword(length = 18) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=";
    const bytes = new Uint32Array(length);

    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < length; index += 1) {
        bytes[index] = Math.floor(Math.random() * alphabet.length);
      }
    }

    return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
  }

  function updateField<K extends keyof TenantFormPayload>(key: K, value: TenantFormPayload[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const payload: TenantFormPayload = {
        name: form.name,
        slug: form.slug?.trim() || null,
        primary_domain: form.primary_domain,
        default_locale: form.default_locale,
        default_currency: form.default_currency.toUpperCase(),
        timezone: form.timezone,
        owner_name: form.owner_name,
        owner_email: form.owner_email,
      };

      if (form.owner_password) {
        payload.owner_password = form.owner_password;
        payload.owner_password_confirmation = form.owner_password_confirmation;
      }

      const result =
        isCreate || !tenant
          ? await createTenant(payload)
          : await updateTenant(tenant.id, payload);

      if (result.error || !result.data) {
        setError(result.error ?? t("serviceUnavailable"));
        return;
      }

      const savedMessage = isCreate ? t("createSuccess") : t("updateSuccess");
      setMessage(savedMessage);

      if (isCreate) {
        router.push(localePath(locale, `/dashboard/tenants/${result.data.id}`));
        router.refresh();
        return;
      }

      router.refresh();
    });
  }

  function handleGeneratePassword() {
    const password = generatePassword();
    setForm((current) => ({
      ...current,
      owner_password: password,
      owner_password_confirmation: password,
    }));
    setMessage(t("passwordGeneratedMessage"));
    setError(null);
  }

  return (
    <section className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <p className="dashboard-kicker">
          {isCreate ? t("createTenantTitle") : t("editTenantTitle")}
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
          {isCreate ? t("createTenantHeading") : t("editTenantHeading")}
        </h2>
        <p className="text-sm leading-7 text-[#6b7280]">
          {isCreate ? t("createTenantDescription") : t("editTenantDescription")}
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("tenantNameLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("tenantSlugLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
            value={form.slug ?? ""}
            onChange={(event) => updateField("slug", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("tenantDomainLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
            value={form.primary_domain}
            onChange={(event) => updateField("primary_domain", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("timezoneLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
            value={form.timezone}
            onChange={(event) => updateField("timezone", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("localeLabel")}</span>
          <select
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
            value={form.default_locale}
            onChange={(event) => updateField("default_locale", event.target.value)}
          >
            <option value="en">{t("localeEnglish")}</option>
            <option value="ar">{t("localeArabic")}</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("currencyLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 uppercase outline-none transition focus:border-accent"
            maxLength={3}
            value={form.default_currency}
            onChange={(event) => updateField("default_currency", event.target.value.toUpperCase())}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("ownerNameLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
            value={form.owner_name}
            onChange={(event) => updateField("owner_name", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("ownerEmailLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
            value={form.owner_email}
            onChange={(event) => updateField("owner_email", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span className="flex items-center justify-between gap-3">
            <span>{t("ownerPasswordLabel")}</span>
            <button
              type="button"
              className="text-xs font-semibold text-accent transition hover:text-[#033466]"
              onClick={handleGeneratePassword}
            >
              {t("generatePasswordButton")}
            </button>
          </span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
            type="password"
            value={form.owner_password ?? ""}
            onChange={(event) => updateField("owner_password", event.target.value)}
            placeholder={isCreate ? "" : t("passwordOptionalHint")}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{t("ownerPasswordConfirmationLabel")}</span>
          <input
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
            type="password"
            value={form.owner_password_confirmation ?? ""}
            onChange={(event) => updateField("owner_password_confirmation", event.target.value)}
          />
        </label>
      </div>

      {isCreate ? (
        <div className="mt-6 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-4 text-sm leading-7 text-[#33506f]">
          {t("trialProvisioningNotice")}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button disabled={isPending} onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </div>

      {message ? <div className="mt-4"><StatusBanner message={message} tone="success" /></div> : null}
      {error ? <div className="mt-4"><StatusBanner message={error} tone="error" /></div> : null}
    </section>
  );
}
