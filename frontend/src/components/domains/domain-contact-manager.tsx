"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin } from "@/lib/auth";
import {
  domainContactTypes,
  type DomainApiMode,
  type DomainContactPayload,
  type DomainContactRecord,
  type DomainRecord,
} from "@/lib/domains";

type DomainContactManagerProps = {
  domainId: string;
  mode: DomainApiMode;
  contacts: DomainContactRecord[];
};

type ContactFormState = {
  id?: number;
  type: DomainContactPayload["type"];
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
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

function emptyContact(type: DomainContactPayload["type"] = "registrant"): ContactFormState {
  return {
    type,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: {
      line1: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
    },
  };
}

export function DomainContactManager({
  domainId,
  mode,
  contacts,
}: DomainContactManagerProps) {
  const t = useTranslations("Domains");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ContactFormState[]>(
    contacts.length > 0
      ? contacts.map((contact) => ({
          id: contact.id,
          type: contact.type,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone ?? "",
          address: {
            line1: contact.address.line1,
            city: contact.address.city,
            state: contact.address.state ?? "",
            postal_code: contact.address.postal_code ?? "",
            country: contact.address.country,
          },
        }))
      : domainContactTypes.map((type) => emptyContact(type)),
  );

  const typeLabels: Record<DomainContactPayload["type"], string> = {
    registrant: t("contactTypeRegistrant"),
    admin: t("contactTypeAdmin"),
    tech: t("contactTypeTech"),
    billing: t("contactTypeBilling"),
  };

  function updateContact(index: number, field: keyof ContactFormState, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function updateAddress(
    index: number,
    field: keyof ContactFormState["address"],
    value: string,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, address: { ...item.address, [field]: value } }
          : item,
      ),
    );
  }

  function handleSubmit() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/${mode}/domains/${domainId}/contacts`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify({
              contacts: items.map((item) => ({
                id: item.id,
                type: item.type,
                first_name: item.first_name.trim(),
                last_name: item.last_name.trim(),
                email: item.email.trim(),
                phone: nullable(item.phone),
                address: {
                  line1: item.address.line1.trim(),
                  city: item.address.city.trim(),
                  state: nullable(item.address.state),
                  postal_code: nullable(item.address.postal_code),
                  country: item.address.country.trim().toUpperCase(),
                },
              })),
            }),
          },
        );

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("saveError"));
          return;
        }

        const payload = (await response.json()) as { data: DomainRecord };
        const nextContacts = payload.data.contacts ?? [];

        setItems(
          nextContacts.length > 0
            ? nextContacts.map((contact) => ({
                id: contact.id,
                type: contact.type,
                first_name: contact.first_name,
                last_name: contact.last_name,
                email: contact.email,
                phone: contact.phone ?? "",
                address: {
                  line1: contact.address.line1,
                  city: contact.address.city,
                  state: contact.address.state ?? "",
                  postal_code: contact.address.postal_code ?? "",
                  country: contact.address.country,
                },
              }))
            : domainContactTypes.map((type) => emptyContact(type)),
        );
        setMessage(t("contactUpdateSuccess"));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-4">
          {items.map((contact, index) => (
            <article
              key={contact.id ?? `${contact.type}-${index}`}
              className="rounded-[1.5rem] border border-line bg-white/80 p-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-foreground">{typeLabels[contact.type]}</p>
                </div>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("firstNameLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateContact(index, "first_name", event.target.value)}
                    value={contact.first_name}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("lastNameLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateContact(index, "last_name", event.target.value)}
                    value={contact.last_name}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("emailLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateContact(index, "email", event.target.value)}
                    type="email"
                    value={contact.email}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("phoneLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateContact(index, "phone", event.target.value)}
                    value={contact.phone}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                  <span>{t("addressLineLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateAddress(index, "line1", event.target.value)}
                    value={contact.address.line1}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("cityLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateAddress(index, "city", event.target.value)}
                    value={contact.address.city}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("stateLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateAddress(index, "state", event.target.value)}
                    value={contact.address.state}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("postalCodeLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    onChange={(event) => updateAddress(index, "postal_code", event.target.value)}
                    value={contact.address.postal_code}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{t("countryLabel")}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 uppercase outline-none transition focus:border-accent"
                    maxLength={2}
                    onChange={(event) => updateAddress(index, "country", event.target.value)}
                    value={contact.address.country}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
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
          {isPending ? t("saving") : t("saveContactsButton")}
        </button>
        <p className="text-sm text-muted">
          {locale === "ar" ? t("rtlReadyLabel") : t("contactManagementDescription")}
        </p>
      </div>
    </div>
  );
}
