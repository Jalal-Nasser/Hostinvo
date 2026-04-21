"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import { billingCycles, type BillingCycle, type ProductRecord } from "@/lib/catalog";
import { type ClientRecord } from "@/lib/clients";
import { type ServerRecord, type ServiceRecord } from "@/lib/provisioning";

type ServiceFormProps = {
  clients: ClientRecord[];
  products: ProductRecord[];
  servers: ServerRecord[];
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

function nullable(value: string): string | null {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
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

  return Object.values(payload.errors)[0]?.[0] ?? null;
}

export function ServiceForm({ clients, products, servers }: ServiceFormProps) {
  const t = useTranslations("Provisioning");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [productId, setProductId] = useState("");
  const [serverId, setServerId] = useState("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [domain, setDomain] = useState("");
  const [username, setUsername] = useState("");
  const [notes, setNotes] = useState("");

  function handleProductChange(nextProductId: string) {
    const product = products.find((item) => item.id === nextProductId);

    setProductId(nextProductId);

    if (product?.server_id) {
      setServerId(product.server_id.toString());
    }
  }

  function submit() {
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/services`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
          },
          body: JSON.stringify({
            client_id: clientId,
            product_id: productId,
            server_id: serverId ? Number(serverId) : null,
            service_type: "hosting",
            billing_cycle: billingCycle,
            domain: nullable(domain),
            username: nullable(username),
            notes: nullable(notes),
          }),
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("serviceSaveError"));
          return;
        }

        const responsePayload = (await response.json()) as { data: ServiceRecord };
        router.replace(localePath(locale, `/dashboard/services/${responsePayload.data.id}`));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("clientLabel")}</span>
            <select className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setClientId(event.target.value)} value={clientId}>
              <option value="">{t("selectClientPlaceholder")}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.display_name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("productLabel")}</span>
            <select className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => handleProductChange(event.target.value)} value={productId}>
              <option value="">{t("selectProductPlaceholder")}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("serverLabel")}</span>
            <select className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setServerId(event.target.value)} value={serverId}>
              <option value="">{t("automaticServerOption")}</option>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name} ({server.hostname})
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("billingCycleLabel")}</span>
            <select className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setBillingCycle(event.target.value as BillingCycle)} value={billingCycle}>
              {billingCycles.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {t(`billingCycle.${cycle}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("domainLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setDomain(event.target.value)} value={domain} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("usernameLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setUsername(event.target.value)} value={username} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("notesLabel")}</span>
            <textarea className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setNotes(event.target.value)} value={notes} />
          </label>
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} onClick={submit} type="button">
          {isPending ? t("saving") : t("createServiceButton")}
        </button>
        <Link className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft" href={localePath(locale, "/dashboard/services")}>
          {t("cancelButton")}
        </Link>
      </div>
    </div>
  );
}
