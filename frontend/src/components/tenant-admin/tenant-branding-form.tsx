"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import {
  submitAdminForm,
  type TenantBrandingRecord,
} from "@/lib/tenant-admin";

type TenantBrandingFormProps = {
  locale: string;
  initialBranding: TenantBrandingRecord;
};

export function TenantBrandingForm({
  locale,
  initialBranding,
}: TenantBrandingFormProps) {
  const copy = tenantAdminCopy(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState(initialBranding.company_name);
  const [portalName, setPortalName] = useState(initialBranding.portal_name);
  const [portalTagline, setPortalTagline] = useState(
    initialBranding.portal_tagline,
  );
  const [defaultCurrency, setDefaultCurrency] = useState(
    initialBranding.default_currency,
  );
  const [defaultLocale, setDefaultLocale] = useState(
    initialBranding.default_locale,
  );
  const [timezone, setTimezone] = useState(initialBranding.timezone);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);

  function handleSubmit() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const formData = new FormData();

      formData.set("company_name", companyName);
      formData.set("portal_name", portalName);
      formData.set("portal_tagline", portalTagline);
      formData.set("default_currency", defaultCurrency);
      formData.set("default_locale", defaultLocale);
      formData.set("timezone", timezone);
      formData.set("remove_logo", removeLogo ? "1" : "0");
      formData.set("remove_favicon", removeFavicon ? "1" : "0");

      if (logoFile) {
        formData.set("logo", logoFile);
      }

      if (faviconFile) {
        formData.set("favicon", faviconFile);
      }

      const result = await submitAdminForm<TenantBrandingRecord>(
        "settings/branding",
        "POST",
        formData,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(copy.branding.saved);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.branding.companyName}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.branding.portalName}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={portalName}
              onChange={(event) => setPortalName(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.branding.portalTagline}</span>
            <textarea
              className="min-h-28 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={portalTagline}
              onChange={(event) => setPortalTagline(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.branding.defaultCurrency}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 uppercase outline-none transition focus:border-accent"
              maxLength={3}
              value={defaultCurrency}
              onChange={(event) => setDefaultCurrency(event.target.value.toUpperCase())}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.branding.defaultLocale}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={defaultLocale}
              onChange={(event) => setDefaultLocale(event.target.value)}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.branding.timezone}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            {copy.branding.logo}
          </h2>
          <div className="mt-4 grid gap-4">
            {initialBranding.logo_url && !removeLogo ? (
              <div className="rounded-2xl border border-line bg-[#faf9f5]/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  {copy.common.currentAsset}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={initialBranding.logo_url}
                  alt={portalName}
                  className="mt-4 h-14 w-auto object-contain"
                />
              </div>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.branding.logo}</span>
              <input
                className="rounded-2xl border border-dashed border-line bg-[#faf9f5]/85 px-4 py-3 text-sm outline-none transition file:me-3 file:rounded-xl file:border-0 file:bg-[#eff6ff] file:px-3 file:py-2 file:font-semibold file:text-[#036deb] focus:border-accent"
                type="file"
                accept="image/*"
                onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <label className="flex items-center gap-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={removeLogo}
                onChange={(event) => setRemoveLogo(event.target.checked)}
              />
              <span>{copy.common.removeAsset}</span>
            </label>
          </div>
        </article>

        <article className="glass-card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            {copy.branding.favicon}
          </h2>
          <div className="mt-4 grid gap-4">
            {initialBranding.favicon_url && !removeFavicon ? (
              <div className="rounded-2xl border border-line bg-[#faf9f5]/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  {copy.common.currentAsset}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={initialBranding.favicon_url}
                  alt={portalName}
                  className="mt-4 h-12 w-12 rounded-xl object-contain"
                />
              </div>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.branding.favicon}</span>
              <input
                className="rounded-2xl border border-dashed border-line bg-[#faf9f5]/85 px-4 py-3 text-sm outline-none transition file:me-3 file:rounded-xl file:border-0 file:bg-[#eff6ff] file:px-3 file:py-2 file:font-semibold file:text-[#036deb] focus:border-accent"
                type="file"
                accept="image/*"
                onChange={(event) => setFaviconFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <label className="flex items-center gap-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={removeFavicon}
                onChange={(event) => setRemoveFavicon(event.target.checked)}
              />
              <span>{copy.common.removeAsset}</span>
            </label>
          </div>
        </article>
      </section>

      {message ? <StatusBanner tone="success" message={message} /> : null}
      {error ? <StatusBanner tone="error" message={error} /> : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={isPending} onClick={handleSubmit}>
          {isPending ? copy.common.saving : copy.common.saveChanges}
        </Button>
      </div>
    </div>
  );
}
