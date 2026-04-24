"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ensureCsrfCookie, readCookie } from "@/components/provisioning/http";
import {
  fetchPleskPlanPreview,
  importPleskPlans,
  type PleskPlanPreviewRecord,
} from "@/lib/provisioning";

type PlanImporterStrings = {
  title: string;
  description: string;
  refreshButton: string;
  refreshingButton: string;
  importButton: string;
  importingButton: string;
  searchLabel: string;
  searchPlaceholder: string;
  planLabel: string;
  ownerLabel: string;
  diskLimitLabel: string;
  bandwidthLimitLabel: string;
  websitesLimitLabel: string;
  mailboxesLimitLabel: string;
  databasesLimitLabel: string;
  productNameLabel: string;
  existingProductLabel: string;
  noPlans: string;
  importSuccess: string;
  importError: string;
  refreshError: string;
  noSelectionError: string;
  alreadyImported: string;
};

type PleskPlanImporterProps = {
  serverId: string;
  locale: string;
  initialPreview: PleskPlanPreviewRecord[];
  strings: PlanImporterStrings;
};

type ImportDraft = {
  selected: boolean;
  productName: string;
};

export function PleskPlanImporter({
  serverId,
  locale,
  initialPreview,
  strings,
}: PleskPlanImporterProps) {
  const router = useRouter();
  const [records, setRecords] = useState(initialPreview);
  const [drafts, setDrafts] = useState<Record<string, ImportDraft>>(() => buildDrafts(initialPreview));
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = useMemo(
    () => records.filter((record) => drafts[record.plan_name]?.selected && !record.existing_product).length,
    [drafts, records],
  );

  function patchDraft(planName: string, patch: Partial<ImportDraft>) {
    setDrafts((current) => ({
      ...current,
      [planName]: {
        ...(current[planName] ?? buildDraft(planName, records.find((entry) => entry.plan_name === planName) ?? null)),
        ...patch,
      },
    }));
  }

  async function refreshPreview() {
    setIsRefreshing(true);
    setError(null);
    setMessage(null);

    try {
      const preview = await fetchPleskPlanPreview(serverId, {
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
      const selected = records.filter((record) => drafts[record.plan_name]?.selected && !record.existing_product);

      if (selected.length === 0) {
        throw new Error(strings.noSelectionError);
      }

      await ensureCsrfCookie();
      const xsrfToken = readCookie("XSRF-TOKEN");
      const result = await importPleskPlans(serverId, {
        imports: selected.map((record) => ({
          plan_name: record.plan_name,
          product_name: drafts[record.plan_name]?.productName || record.plan_name,
        })),
      }, xsrfToken);

      setMessage(
        strings.importSuccess
          .replace("{created}", String(result.summary.products_created))
          .replace("{mapped}", String(result.summary.products_mapped)),
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
          {selectedCount}/{records.length}
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
        <p className="mt-6 text-sm text-muted">{strings.noPlans}</p>
      ) : (
        <div className="mt-6 divide-y divide-line rounded-[1.5rem] border border-line bg-[#faf9f5]/60">
          {records.map((record) => {
            const draft = drafts[record.plan_name] ?? buildDraft(record.plan_name, record);
            const disabled = !!record.existing_product;

            return (
              <div key={record.plan_name} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={draft.selected}
                      disabled={disabled}
                      onChange={(event) =>
                        patchDraft(record.plan_name, {
                          selected: event.target.checked,
                        })
                      }
                      className="mt-1 h-4 w-4 rounded border-line"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{record.plan_name}</p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                        <span>{strings.ownerLabel}: {record.owner_name ?? "-"}</span>
                        <span>{strings.diskLimitLabel}: {record.disk_limit_mb ?? "-"}</span>
                        <span>{strings.bandwidthLimitLabel}: {record.bandwidth_limit_mb ?? "-"}</span>
                        <span>{strings.websitesLimitLabel}: {record.websites_limit ?? "-"}</span>
                        <span>{strings.mailboxesLimitLabel}: {record.mailboxes_limit ?? "-"}</span>
                        <span>{strings.databasesLimitLabel}: {record.databases_limit ?? "-"}</span>
                      </div>
                    </div>
                  </div>

                  {record.existing_product ? (
                    <div className="text-sm text-muted">
                      {strings.alreadyImported}:{" "}
                      <Link
                        href={`/${locale}/dashboard/products/${record.existing_product.id}/edit`}
                        className="font-semibold text-foreground underline"
                      >
                        {record.existing_product.name}
                      </Link>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{strings.productNameLabel}</span>
                    <input
                      value={draft.productName}
                      disabled={disabled}
                      onChange={(event) =>
                        patchDraft(record.plan_name, {
                          productName: event.target.value,
                        })
                      }
                      className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <div className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{strings.existingProductLabel}</span>
                    <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-muted">
                      {record.existing_product?.name ?? "-"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function buildDrafts(records: PleskPlanPreviewRecord[]): Record<string, ImportDraft> {
  return Object.fromEntries(records.map((record) => [record.plan_name, buildDraft(record.plan_name, record)]));
}

function mergeDrafts(
  current: Record<string, ImportDraft>,
  records: PleskPlanPreviewRecord[],
): Record<string, ImportDraft> {
  return Object.fromEntries(
    records.map((record) => [
      record.plan_name,
      {
        ...buildDraft(record.plan_name, record),
        ...(current[record.plan_name] ?? {}),
      },
    ]),
  );
}

function buildDraft(planName: string, record: PleskPlanPreviewRecord | null): ImportDraft {
  return {
    selected: false,
    productName: record?.existing_product?.name ?? planName,
  };
}
