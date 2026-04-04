"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import {
  deleteAdminResource,
  localizedValue,
  submitAdminJson,
  type NetworkIncidentRecord,
} from "@/lib/tenant-admin";

type NetworkIncidentManagerProps = {
  locale: string;
  incidents: NetworkIncidentRecord[];
};

type IncidentFormState = {
  title_en: string;
  title_ar: string;
  slug: string;
  summary_en: string;
  summary_ar: string;
  details_en: string;
  details_ar: string;
  status: "open" | "monitoring" | "maintenance" | "resolved";
  severity: "info" | "warning" | "critical";
  is_public: boolean;
  sort_order: number;
  started_at: string;
  resolved_at: string;
};

function emptyIncident(): IncidentFormState {
  return {
    title_en: "",
    title_ar: "",
    slug: "",
    summary_en: "",
    summary_ar: "",
    details_en: "",
    details_ar: "",
    status: "open",
    severity: "warning",
    is_public: true,
    sort_order: 0,
    started_at: "",
    resolved_at: "",
  };
}

function fromRecord(record: NetworkIncidentRecord): IncidentFormState {
  return {
    title_en: record.title_en,
    title_ar: record.title_ar ?? "",
    slug: record.slug,
    summary_en: record.summary_en ?? "",
    summary_ar: record.summary_ar ?? "",
    details_en: record.details_en ?? "",
    details_ar: record.details_ar ?? "",
    status: record.status as IncidentFormState["status"],
    severity: record.severity as IncidentFormState["severity"],
    is_public: record.is_public,
    sort_order: record.sort_order,
    started_at: record.started_at ? record.started_at.slice(0, 16) : "",
    resolved_at: record.resolved_at ? record.resolved_at.slice(0, 16) : "",
  };
}

export function NetworkIncidentManager({
  locale,
  incidents,
}: NetworkIncidentManagerProps) {
  const copy = tenantAdminCopy(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(incidents[0]?.id ?? null);
  const [form, setForm] = useState<IncidentFormState>(
    incidents[0] ? fromRecord(incidents[0]) : emptyIncident(),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRecord = useMemo(
    () => incidents.find((item) => item.id === selectedId) ?? null,
    [incidents, selectedId],
  );

  function loadRecord(record: NetworkIncidentRecord | null) {
    setSelectedId(record?.id ?? null);
    setForm(record ? fromRecord(record) : emptyIncident());
    setMessage(null);
    setError(null);
  }

  function handleSave() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await submitAdminJson<NetworkIncidentRecord>(
        selectedId ? `network-incidents/${selectedId}` : "network-incidents",
        selectedId ? "PUT" : "POST",
        {
          ...form,
          title_ar: form.title_ar || null,
          summary_en: form.summary_en || null,
          summary_ar: form.summary_ar || null,
          details_en: form.details_en || null,
          details_ar: form.details_ar || null,
          started_at: form.started_at || null,
          resolved_at: form.resolved_at || null,
        },
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(selectedId ? copy.common.updateSuccess : copy.common.createSuccess);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!selectedId || !window.confirm(copy.common.deleteConfirm)) {
      return;
    }

    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await deleteAdminResource(`network-incidents/${selectedId}`);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(copy.common.deleteSuccess);
      loadRecord(null);
      router.refresh();
    });
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="glass-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="dashboard-kicker">{copy.content.incidentsTitle}</p>
            <h2 className="mt-2 text-xl font-semibold text-[#0a1628]">
              {copy.incidents.pageTitle}
            </h2>
          </div>
          <Button variant="outline" onClick={() => loadRecord(null)}>
            {copy.common.createNew}
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          {incidents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-[#faf9f5]/65 p-4 text-sm text-muted">
              {copy.common.emptyTitle}
            </div>
          ) : (
            incidents.map((incident) => {
              const active = incident.id === selectedId;

              return (
                <button
                  key={incident.id}
                  type="button"
                  onClick={() => loadRecord(incident)}
                  className={[
                    "rounded-2xl border px-4 py-4 text-start transition",
                    active
                      ? "border-[#bfd7ff] bg-[#eff6ff]"
                      : "border-line bg-[#faf9f5]/70 hover:bg-[#f4f8ff]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#0a1628]">
                      {localizedValue(locale, incident.title_en, incident.title_ar)}
                    </p>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      {copy.incidents.statusLabels[incident.status as keyof typeof copy.incidents.statusLabels]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#5f7389]">
                    {localizedValue(
                      locale,
                      incident.summary_en,
                      incident.summary_ar,
                    ) || incident.slug}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <article className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.common.titleEn}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.title_en}
              onChange={(event) => setForm((current) => ({ ...current, title_en: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.common.titleAr}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              dir="rtl"
              value={form.title_ar}
              onChange={(event) => setForm((current) => ({ ...current, title_ar: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.common.slug}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.common.status}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as IncidentFormState["status"],
                }))
              }
            >
              {Object.entries(copy.incidents.statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.incidents.severity}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.severity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  severity: event.target.value as IncidentFormState["severity"],
                }))
              }
            >
              {Object.entries(copy.incidents.severityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.common.orderLabel}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              type="number"
              value={form.sort_order}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sort_order: Number(event.target.value || "0"),
                }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.incidents.summaryEn}</span>
            <textarea
              className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.summary_en}
              onChange={(event) => setForm((current) => ({ ...current, summary_en: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.incidents.summaryAr}</span>
            <textarea
              className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              dir="rtl"
              value={form.summary_ar}
              onChange={(event) => setForm((current) => ({ ...current, summary_ar: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.incidents.detailsEn}</span>
            <textarea
              className="min-h-40 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.details_en}
              onChange={(event) => setForm((current) => ({ ...current, details_en: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.incidents.detailsAr}</span>
            <textarea
              className="min-h-40 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              dir="rtl"
              value={form.details_ar}
              onChange={(event) => setForm((current) => ({ ...current, details_ar: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.incidents.startedAt}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              type="datetime-local"
              value={form.started_at}
              onChange={(event) => setForm((current) => ({ ...current, started_at: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.incidents.resolvedAt}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              type="datetime-local"
              value={form.resolved_at}
              onChange={(event) => setForm((current) => ({ ...current, resolved_at: event.target.value }))}
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-foreground md:col-span-2">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_public: event.target.checked }))
              }
            />
            <span>{copy.incidents.isPublic}</span>
          </label>
        </div>

        <div className="mt-6 grid gap-3">
          {message ? <StatusBanner tone="success" message={message} /> : null}
          {error ? <StatusBanner tone="error" message={error} /> : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button disabled={isPending} onClick={handleSave}>
            {isPending ? copy.common.saving : copy.common.saveChanges}
          </Button>
          {selectedRecord ? (
            <Button variant="outline" disabled={isPending} onClick={handleDelete}>
              {copy.common.deleteItem}
            </Button>
          ) : null}
        </div>
      </article>
    </section>
  );
}
