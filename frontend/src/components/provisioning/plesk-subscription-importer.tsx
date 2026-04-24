"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ensureCsrfCookie, readCookie } from "@/components/provisioning/http";
import type { ClientRecord } from "@/lib/clients";
import type { ProductRecord } from "@/lib/catalog";
import {
  fetchPleskImportPreview,
  importPleskSubscriptions,
  type PleskImportPayload,
  type PleskImportPreviewRecord,
} from "@/lib/provisioning";

type ImporterStrings = {
  title: string;
  description: string;
  refreshButton: string;
  refreshingButton: string;
  importButton: string;
  importingButton: string;
  searchLabel: string;
  searchPlaceholder: string;
  subscriptionLabel: string;
  usernameLabel: string;
  planLabel: string;
  statusLabel: string;
  emailLabel: string;
  usageLabel: string;
  productLabel: string;
  clientLabel: string;
  autoClientOption: string;
  selectProductPlaceholder: string;
  selectClientPlaceholder: string;
  companyNameLabel: string;
  countryLabel: string;
  existingServiceLabel: string;
  existingClientLabel: string;
  noSubscriptions: string;
  importSuccess: string;
  importError: string;
  refreshError: string;
  noSelectionError: string;
  alreadyImported: string;
  productRequired: string;
};

type PleskSubscriptionImporterProps = {
  serverId: string;
  locale: string;
  initialPreview: PleskImportPreviewRecord[];
  products: ProductRecord[];
  clients: ClientRecord[];
  strings: ImporterStrings;
};

type ImportDraft = {
  selected: boolean;
  productId: string;
  clientId: string;
  clientEmail: string;
  companyName: string;
  country: string;
};

export function PleskSubscriptionImporter({
  serverId,
  locale,
  initialPreview,
  products,
  clients,
  strings,
}: PleskSubscriptionImporterProps) {
  const router = useRouter();
  const [records, setRecords] = useState(initialPreview);
  const [drafts, setDrafts] = useState<Record<string, ImportDraft>>(() => buildDrafts(initialPreview));
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedProducts = useMemo(
    () => [...products].sort((left, right) => left.name.localeCompare(right.name)),
    [products],
  );
  const sortedClients = useMemo(
    () => [...clients].sort((left, right) => left.display_name.localeCompare(right.display_name)),
    [clients],
  );

  function patchDraft(subscriptionName: string, patch: Partial<ImportDraft>) {
    setDrafts((current) => ({
      ...current,
      [subscriptionName]: {
        ...(current[subscriptionName] ?? buildDraft(subscriptionName, records.find((entry) => entry.subscription_name === subscriptionName) ?? null)),
        ...patch,
      },
    }));
  }

  async function refreshPreview() {
    setIsRefreshing(true);
    setError(null);
    setMessage(null);

    try {
      const preview = await fetchPleskImportPreview(serverId, {
        search: search.trim() || undefined,
      });

      if (!preview) {
        throw new Error(strings.refreshError);
      }

      setRecords(preview.data);
      setDrafts((current) => mergeDrafts(current, preview.data));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : strings.refreshError);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleImport() {
    setIsImporting(true);
    setError(null);
    setMessage(null);

    try {
      const selected = records
        .filter((record) => (drafts[record.subscription_name]?.selected ?? false) && !record.existing_service);

      if (selected.length === 0) {
        throw new Error(strings.noSelectionError);
      }

      const imports = selected.map((record) => {
        const draft = drafts[record.subscription_name];

        if (!draft?.productId) {
          throw new Error(`${record.subscription_name}: ${strings.productRequired}`);
        }

        const payload: PleskImportPayload["imports"][number] = {
          subscription_name: record.subscription_name,
          product_id: draft.productId,
        };

        if (draft.clientId) {
          payload.client_id = draft.clientId;
        } else {
          payload.client = {
            email: draft.clientEmail || record.email || "",
            company_name: draft.companyName || record.owner_name || record.domain,
            country: draft.country || "US",
          };
        }

        return payload;
      });

      await ensureCsrfCookie();
      const xsrfToken = readCookie("XSRF-TOKEN");
      const result = await importPleskSubscriptions(serverId, { imports }, xsrfToken);

      setMessage(
        strings.importSuccess
          .replace("{services}", String(result.summary.services_created))
          .replace("{clients}", String(result.summary.clients_created)),
      );

      await refreshPreview();
      router.refresh();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : strings.importError);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{strings.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{strings.description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={refreshPreview}
            disabled={isRefreshing || isImporting}
            className="rounded-full border border-line bg-[#faf9f5]/85 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? strings.refreshingButton : strings.refreshButton}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting || isRefreshing}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImporting ? strings.importingButton : strings.importButton}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>{strings.searchLabel}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={strings.searchPlaceholder}
            className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
          />
        </label>
        <div className="text-sm text-muted">
          {records.length} {strings.subscriptionLabel.toLowerCase()}
        </div>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl border border-line bg-[#f6fff6] px-4 py-3 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-2xl border border-line bg-[#fff5f2] px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      ) : null}

      {records.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{strings.noSubscriptions}</p>
      ) : (
        <div className="mt-6 divide-y divide-line rounded-[1.5rem] border border-line bg-[#faf9f5]/60">
          {records.map((record) => {
            const draft = drafts[record.subscription_name] ?? buildDraft(record.subscription_name, record);
            const disabled = !!record.existing_service;

            return (
              <div key={record.subscription_name} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={draft.selected}
                      disabled={disabled}
                      onChange={(event) =>
                        patchDraft(record.subscription_name, {
                          selected: event.target.checked,
                        })
                      }
                      className="mt-1 h-4 w-4 rounded border-line"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{record.domain}</p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                        <span>{strings.subscriptionLabel}: {record.subscription_name}</span>
                        <span>{strings.usernameLabel}: {record.username ?? "-"}</span>
                        <span>{strings.planLabel}: {record.service_plan ?? "-"}</span>
                        <span>{strings.statusLabel}: {record.raw_status ?? record.status}</span>
                        <span>{strings.emailLabel}: {record.email ?? "-"}</span>
                        <span>
                          {strings.usageLabel}: {record.disk_used_mb}/{record.disk_limit_mb} MB
                        </span>
                      </div>
                    </div>
                  </div>

                  {record.existing_service ? (
                    <div className="text-sm text-muted">
                      {strings.alreadyImported}:{" "}
                      <Link
                        href={`/${locale}/dashboard/services/${record.existing_service.id}`}
                        className="font-semibold text-foreground underline"
                      >
                        {record.existing_service.reference_number}
                      </Link>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{strings.productLabel}</span>
                    <select
                      value={draft.productId}
                      disabled={disabled}
                      onChange={(event) =>
                        patchDraft(record.subscription_name, {
                          productId: event.target.value,
                        })
                      }
                      className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">{strings.selectProductPlaceholder}</option>
                      {sortedProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{strings.clientLabel}</span>
                    <select
                      value={draft.clientId}
                      disabled={disabled}
                      onChange={(event) =>
                        patchDraft(record.subscription_name, {
                          clientId: event.target.value,
                        })
                      }
                      className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">{record.matched_client ? `${strings.autoClientOption}: ${record.matched_client.display_name}` : strings.selectClientPlaceholder}</option>
                      {sortedClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.display_name} ({client.email})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {!draft.clientId && !record.matched_client ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{strings.emailLabel}</span>
                      <input
                        value={draft.clientEmail}
                        disabled={disabled}
                        onChange={(event) =>
                          patchDraft(record.subscription_name, {
                            clientEmail: event.target.value,
                          })
                        }
                        className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{strings.companyNameLabel}</span>
                      <input
                        value={draft.companyName}
                        disabled={disabled}
                        onChange={(event) =>
                          patchDraft(record.subscription_name, {
                            companyName: event.target.value,
                          })
                        }
                        className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{strings.countryLabel}</span>
                      <input
                        value={draft.country}
                        disabled={disabled}
                        onChange={(event) =>
                          patchDraft(record.subscription_name, {
                            country: event.target.value,
                          })
                        }
                        className="rounded-2xl border border-line bg-white px-4 py-3 uppercase outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                  {record.existing_service ? (
                    <span>
                      {strings.existingServiceLabel}: {record.existing_service.reference_number}
                    </span>
                  ) : null}
                  {record.matched_client ? (
                    <span>
                      {strings.existingClientLabel}: {record.matched_client.display_name}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function buildDrafts(records: PleskImportPreviewRecord[]): Record<string, ImportDraft> {
  return Object.fromEntries(records.map((record) => [record.subscription_name, buildDraft(record.subscription_name, record)]));
}

function mergeDrafts(
  current: Record<string, ImportDraft>,
  records: PleskImportPreviewRecord[],
): Record<string, ImportDraft> {
  return Object.fromEntries(
    records.map((record) => [
      record.subscription_name,
      {
        ...buildDraft(record.subscription_name, record),
        ...(current[record.subscription_name] ?? {}),
      },
    ]),
  );
}

function buildDraft(subscriptionName: string, record: PleskImportPreviewRecord | null): ImportDraft {
  return {
    selected: false,
    productId: record?.suggested_product?.id ?? "",
    clientId: "",
    clientEmail: record?.email ?? "",
    companyName: record?.owner_name ?? record?.domain ?? subscriptionName,
    country: "US",
  };
}
