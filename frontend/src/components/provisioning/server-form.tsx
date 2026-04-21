"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import {
  serverPanelTypes,
  serverStatuses,
  type ServerPanelType,
  type ServerRecord,
  type ServerStatus,
} from "@/lib/provisioning";

type ServerFormProps = {
  mode: "create" | "edit";
  initialServer?: ServerRecord;
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

export function ServerForm({ mode, initialServer }: ServerFormProps) {
  const t = useTranslations("Provisioning");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialServer?.name ?? "");
  const [hostname, setHostname] = useState(initialServer?.hostname ?? "");
  const [ipAddress, setIpAddress] = useState(initialServer?.ip_address ?? "");
  const [panelType, setPanelType] = useState<ServerPanelType>(initialServer?.panel_type ?? "cpanel");
  const [apiEndpoint, setApiEndpoint] = useState(initialServer?.api_endpoint ?? "");
  const [apiPort, setApiPort] = useState(initialServer?.api_port?.toString() ?? "");
  const [status, setStatus] = useState<ServerStatus>(initialServer?.status ?? "active");
  const [username, setUsername] = useState(initialServer?.username ?? "");
  const [apiToken, setApiToken] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [verifySsl, setVerifySsl] = useState(initialServer?.verify_ssl ?? true);
  const [maxAccounts, setMaxAccounts] = useState(initialServer?.max_accounts?.toString() ?? "");
  const [notes, setNotes] = useState(initialServer?.notes ?? "");

  const panelLabels: Record<ServerPanelType, string> = {
    cpanel: t("panelTypeCpanel"),
    plesk: t("panelTypePlesk"),
    directadmin: t("panelTypeDirectadmin"),
    custom: t("panelTypeCustom"),
  };

  const statusLabels: Record<ServerStatus, string> = {
    active: t("serverStatusActive"),
    inactive: t("serverStatusInactive"),
    maintenance: t("serverStatusMaintenance"),
  };

  function payload() {
    return {
      name: name.trim(),
      hostname: hostname.trim(),
      ip_address: nullable(ipAddress),
      panel_type: panelType,
      api_endpoint: apiEndpoint.trim(),
      api_port: apiPort.trim() === "" ? null : Number(apiPort),
      status,
      verify_ssl: verifySsl,
      max_accounts: maxAccounts.trim() === "" ? null : Number(maxAccounts),
      username: nullable(username),
      credentials: {
        api_token: panelType === "plesk" ? null : nullable(apiToken),
        api_key: panelType === "plesk" ? nullable(apiToken) : null,
        api_secret: nullable(apiSecret),
      },
      notes: nullable(notes),
    };
  }

  function submit() {
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          mode === "create"
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/servers`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/servers/${initialServer?.id}`,
          {
            method: mode === "create" ? "POST" : "PUT",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify(payload()),
          },
        );

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("serverSaveError"));
          return;
        }

        const responsePayload = (await response.json()) as { data: ServerRecord };
        router.replace(localePath(locale, `/dashboard/servers/${responsePayload.data.id}`));
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
            <span>{t("serverNameLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setName(event.target.value)} value={name} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("hostnameLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setHostname(event.target.value)} value={hostname} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("ipAddressLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setIpAddress(event.target.value)} value={ipAddress} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("panelTypeLabel")}</span>
            <select className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setPanelType(event.target.value as ServerPanelType)} value={panelType}>
              {serverPanelTypes.map((value) => (
                <option key={value} value={value}>
                  {panelLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("apiEndpointLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setApiEndpoint(event.target.value)} value={apiEndpoint} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("apiPortLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" min={1} max={65535} onChange={(event) => setApiPort(event.target.value)} type="number" value={apiPort} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("serverStatusLabel")}</span>
            <select className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setStatus(event.target.value as ServerStatus)} value={status}>
              {serverStatuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("usernameLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setUsername(event.target.value)} value={username} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{panelType === "plesk" ? t("apiKeyLabel") : t("apiTokenLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setApiToken(event.target.value)} type="password" value={apiToken} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("apiSecretLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" onChange={(event) => setApiSecret(event.target.value)} type="password" value={apiSecret} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("maxAccountsLabel")}</span>
            <input className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent" min={0} onChange={(event) => setMaxAccounts(event.target.value)} type="number" value={maxAccounts} />
          </label>

          <label className="flex items-center gap-3 text-sm text-muted">
            <input checked={verifySsl} className="h-4 w-4 rounded border-line" onChange={(event) => setVerifySsl(event.target.checked)} type="checkbox" />
            <span>{t("verifySslLabel")}</span>
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
          {isPending ? t("saving") : mode === "create" ? t("createServerButton") : t("saveButton")}
        </button>
        <Link className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft" href={localePath(locale, mode === "edit" && initialServer ? `/dashboard/servers/${initialServer.id}` : "/dashboard/servers")}>
          {t("cancelButton")}
        </Link>
      </div>
    </div>
  );
}
