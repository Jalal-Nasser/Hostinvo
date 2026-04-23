"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import {
  addressTypes,
  clientStatuses,
  clientTypes,
  type ClientAddress,
  type ClientFormPayload,
  type ClientRecord,
  type ClientStatus,
  type ClientType,
} from "@/lib/clients";

type ClientFormProps = {
  mode: "create" | "edit";
  initialClient?: ClientRecord;
};

type ContactFormState = {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  is_primary: boolean;
};

type AddressFormState = {
  id?: string;
  type: ClientAddress["type"];
  line_1: string;
  line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
};

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

async function ensureCsrfCookie() {
  await fetch(`${backendOrigin}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}

function emptyContact(): ContactFormState {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
    is_primary: false,
  };
}

function emptyAddress(): AddressFormState {
  return {
    type: "billing",
    line_1: "",
    line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    is_primary: false,
  };
}

function nullable(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  return normalized === "" ? null : normalized;
}

function firstErrorFromPayload(payload: {
  message?: string;
  errors?: Record<string, string[]>;
} | null) {
  if (payload?.message) {
    return payload.message;
  }

  if (!payload?.errors) {
    return null;
  }

  const firstField = Object.values(payload.errors)[0];

  return firstField?.[0] ?? null;
}

export function ClientForm({ mode, initialClient }: ClientFormProps) {
  const t = useTranslations("Clients");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientType, setClientType] = useState<ClientType>(
    initialClient?.client_type ?? "company",
  );
  const [status, setStatus] = useState<ClientStatus>(initialClient?.status ?? "active");
  const [companyName, setCompanyName] = useState(initialClient?.company_name ?? "");
  const [firstName, setFirstName] = useState(initialClient?.first_name ?? "");
  const [lastName, setLastName] = useState(initialClient?.last_name ?? "");
  const [email, setEmail] = useState(initialClient?.email ?? "");
  const [phone, setPhone] = useState(initialClient?.phone ?? "");
  const [country, setCountry] = useState(initialClient?.country ?? "");
  const [preferredLocale, setPreferredLocale] = useState(
    initialClient?.preferred_locale ?? locale,
  );
  const [currency, setCurrency] = useState(initialClient?.currency ?? "USD");
  const [notes, setNotes] = useState(initialClient?.notes ?? "");
  const [portalAccessEnabled, setPortalAccessEnabled] = useState(Boolean(initialClient?.owner));
  const [portalPassword, setPortalPassword] = useState("");
  const [sendVerificationEmail, setSendVerificationEmail] = useState(!initialClient?.owner);
  const [contacts, setContacts] = useState<ContactFormState[]>(
    initialClient?.contacts?.map((contact) => ({
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone ?? "",
      job_title: contact.job_title ?? "",
      is_primary: contact.is_primary,
    })) ?? [],
  );
  const [addresses, setAddresses] = useState<AddressFormState[]>(
    initialClient?.addresses?.map((address) => ({
      id: address.id,
      type: address.type,
      line_1: address.line_1,
      line_2: address.line_2 ?? "",
      city: address.city,
      state: address.state ?? "",
      postal_code: address.postal_code ?? "",
      country: address.country,
      is_primary: address.is_primary,
    })) ?? [],
  );

  const statusLabels: Record<ClientStatus, string> = {
    active: t("statusActive"),
    inactive: t("statusInactive"),
    lead: t("statusLead"),
  };

  const typeLabels: Record<ClientType, string> = {
    company: t("typeCompany"),
    individual: t("typeIndividual"),
  };

  const addressTypeLabels: Record<ClientAddress["type"], string> = {
    billing: t("addressTypeBilling"),
    mailing: t("addressTypeMailing"),
    service: t("addressTypeService"),
  };

  function normalizePayload(): ClientFormPayload {
    return {
      client_type: clientType,
      company_name: nullable(companyName),
      first_name: nullable(firstName),
      last_name: nullable(lastName),
      email: email.trim(),
      phone: nullable(phone),
      country: country.trim().toUpperCase(),
      status,
      preferred_locale: preferredLocale,
      currency: currency.trim().toUpperCase(),
      notes: nullable(notes),
      portal_access: {
        enabled: portalAccessEnabled,
        password: portalPassword.trim() === "" ? null : portalPassword,
        send_verification_email: sendVerificationEmail,
      },
      contacts: contacts.map((contact) => ({
        id: contact.id,
        first_name: contact.first_name.trim(),
        last_name: contact.last_name.trim(),
        email: contact.email.trim(),
        phone: nullable(contact.phone),
        job_title: nullable(contact.job_title),
        is_primary: contact.is_primary,
      })),
      addresses: addresses.map((address) => ({
        id: address.id,
        type: address.type,
        line_1: address.line_1.trim(),
        line_2: nullable(address.line_2),
        city: address.city.trim(),
        state: nullable(address.state),
        postal_code: nullable(address.postal_code),
        country: address.country.trim().toUpperCase(),
        is_primary: address.is_primary,
      })),
    };
  }

  function updateContact(
    index: number,
    field: keyof (typeof contacts)[number],
    value: string | boolean,
  ) {
    setContacts((current) =>
      current.map((contact, itemIndex) => {
        if (itemIndex !== index) {
          if (field === "is_primary" && value === true) {
            return { ...contact, is_primary: false };
          }

          return contact;
        }

        return { ...contact, [field]: value };
      }),
    );
  }

  function updateAddress(
    index: number,
    field: keyof (typeof addresses)[number],
    value: string | boolean,
  ) {
    setAddresses((current) =>
      current.map((address, itemIndex) => {
        if (itemIndex !== index) {
          if (field === "is_primary" && value === true) {
            return { ...address, is_primary: false };
          }

          return address;
        }

        return { ...address, [field]: value };
      }),
    );
  }

  function handleSubmit() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const requestPayload = normalizePayload();
        const response = await fetch(
          mode === "create"
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/clients`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/clients/${initialClient?.id}`,
          {
            method: mode === "create" ? "POST" : "PUT",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify(requestPayload),
          },
        );

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("saveError"));
          return;
        }

        const responsePayload = (await response.json()) as { data: ClientRecord };
        const targetClientId = responsePayload.data.id;

        setMessage(mode === "create" ? t("createSuccess") : t("updateSuccess"));
        router.replace(localePath(locale, `/dashboard/clients/${targetClientId}`));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  const cancelHref =
    mode === "create"
      ? localePath(locale, "/dashboard/clients")
      : localePath(locale, `/dashboard/clients/${initialClient?.id}`);

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("typeLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setClientType(event.target.value as ClientType)}
              value={clientType}
            >
              {clientTypes.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setStatus(event.target.value as ClientStatus)}
              value={status}
            >
              {clientStatuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("companyNameLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setCompanyName(event.target.value)}
              value={companyName}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("firstNameLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setFirstName(event.target.value)}
              value={firstName}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("lastNameLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setLastName(event.target.value)}
              value={lastName}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("emailLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("phoneLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setPhone(event.target.value)}
              value={phone}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("countryLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 uppercase outline-none transition focus:border-accent"
              maxLength={2}
              onChange={(event) => setCountry(event.target.value)}
              required
              value={country}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("currencyLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 uppercase outline-none transition focus:border-accent"
              maxLength={3}
              onChange={(event) => setCurrency(event.target.value)}
              required
              value={currency}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("localeLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setPreferredLocale(event.target.value)}
              value={preferredLocale}
            >
              <option value="en">{t("localeEnglish")}</option>
              <option value="ar">{t("localeArabic")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("notesLabel")}</span>
            <textarea
              className="min-h-28 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
          </label>

          <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("portalAccessTitle")}</p>
                <p className="mt-2 text-sm text-muted">{t("portalAccessDescription")}</p>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  checked={portalAccessEnabled}
                  className="h-4 w-4 rounded border-line accent-accent"
                  onChange={(event) => setPortalAccessEnabled(event.target.checked)}
                  type="checkbox"
                />
                <span>{t("portalAccessEnabledLabel")}</span>
              </label>
            </div>

            {portalAccessEnabled ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("portalPasswordLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => setPortalPassword(event.target.value)}
                    type="password"
                    value={portalPassword}
                  />
                </label>

                <label className="flex items-center gap-2 self-end text-sm font-medium text-foreground">
                  <input
                    checked={sendVerificationEmail}
                    className="h-4 w-4 rounded border-line accent-accent"
                    onChange={(event) => setSendVerificationEmail(event.target.checked)}
                    type="checkbox"
                  />
                  <span>{t("portalSendVerificationLabel")}</span>
                </label>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{t("contactsSection")}</h2>
            <p className="mt-2 text-sm text-muted">{t("contactsDescription")}</p>
          </div>

          <button
            className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            onClick={() => setContacts((current) => [...current, emptyContact()])}
            type="button"
          >
            {t("addContact")}
          </button>
        </div>

        {contacts.length === 0 ? (
          <p className="mt-6 text-sm text-muted">{t("noContacts")}</p>
        ) : (
          <div className="mt-6 grid gap-4">
            {contacts.map((contact, index) => (
              <article
                key={contact.id ?? `contact-${index}`}
                className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">
                    {t("contactCardTitle", { number: index + 1 })}
                  </p>
                  <button
                    className="text-sm font-medium text-red-700"
                    onClick={() =>
                      setContacts((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    type="button"
                  >
                    {t("removeContact")}
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("firstNameLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateContact(index, "first_name", event.target.value)}
                      value={contact.first_name}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("lastNameLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateContact(index, "last_name", event.target.value)}
                      value={contact.last_name}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("emailLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateContact(index, "email", event.target.value)}
                      type="email"
                      value={contact.email}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("phoneLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateContact(index, "phone", event.target.value)}
                      value={contact.phone}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                    <span>{t("jobTitleLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateContact(index, "job_title", event.target.value)}
                      value={contact.job_title}
                    />
                  </label>
                </div>

                <label className="mt-4 flex items-center gap-3 text-sm text-muted">
                  <input
                    checked={contact.is_primary}
                    className="h-4 w-4 rounded border-line"
                    onChange={(event) => updateContact(index, "is_primary", event.target.checked)}
                    type="checkbox"
                  />
                  <span>{t("primaryLabel")}</span>
                </label>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{t("addressesSection")}</h2>
            <p className="mt-2 text-sm text-muted">{t("addressesDescription")}</p>
          </div>

          <button
            className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            onClick={() => setAddresses((current) => [...current, emptyAddress()])}
            type="button"
          >
            {t("addAddress")}
          </button>
        </div>

        {addresses.length === 0 ? (
          <p className="mt-6 text-sm text-muted">{t("noAddresses")}</p>
        ) : (
          <div className="mt-6 grid gap-4">
            {addresses.map((address, index) => (
              <article
                key={address.id ?? `address-${index}`}
                className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">
                    {t("addressCardTitle", { number: index + 1 })}
                  </p>
                  <button
                    className="text-sm font-medium text-red-700"
                    onClick={() =>
                      setAddresses((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    type="button"
                  >
                    {t("removeAddress")}
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("addressTypeLabel")}</span>
                    <select
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) =>
                        updateAddress(index, "type", event.target.value as ClientAddress["type"])
                      }
                      value={address.type}
                    >
                      {addressTypes.map((type) => (
                        <option key={type} value={type}>
                          {addressTypeLabels[type]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("countryLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 uppercase outline-none transition focus:border-accent"
                      maxLength={2}
                      onChange={(event) => updateAddress(index, "country", event.target.value)}
                      value={address.country}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                    <span>{t("addressLine1Label")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateAddress(index, "line_1", event.target.value)}
                      value={address.line_1}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                    <span>{t("addressLine2Label")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateAddress(index, "line_2", event.target.value)}
                      value={address.line_2 ?? ""}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("cityLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateAddress(index, "city", event.target.value)}
                      value={address.city}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("stateLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateAddress(index, "state", event.target.value)}
                      value={address.state ?? ""}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("postalCodeLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateAddress(index, "postal_code", event.target.value)}
                      value={address.postal_code ?? ""}
                    />
                  </label>
                </div>

                <label className="mt-4 flex items-center gap-3 text-sm text-muted">
                  <input
                    checked={address.is_primary}
                    className="h-4 w-4 rounded border-line"
                    onChange={(event) => updateAddress(index, "is_primary", event.target.checked)}
                    type="checkbox"
                  />
                  <span>{t("primaryLabel")}</span>
                </label>
              </article>
            ))}
          </div>
        )}
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={handleSubmit}
          type="button"
        >
          {isPending
            ? mode === "create"
              ? t("creating")
              : t("saving")
            : mode === "create"
              ? t("createButton")
              : t("saveButton")}
        </button>

        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={cancelHref}
        >
          {t("cancelButton")}
        </Link>
      </div>
    </div>
  );
}
