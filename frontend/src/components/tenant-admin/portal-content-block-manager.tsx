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
  type PortalContentBlockRecord,
} from "@/lib/tenant-admin";

type PortalContentBlockManagerProps = {
  locale: string;
  blocks: PortalContentBlockRecord[];
};

type BlockFormState = {
  section: string;
  key: string;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  cta_label_en: string;
  cta_label_ar: string;
  cta_href: string;
  status: "draft" | "published" | "archived";
  sort_order: number;
};

function emptyBlock(): BlockFormState {
  return {
    section: "website_security",
    key: "",
    title_en: "",
    title_ar: "",
    body_en: "",
    body_ar: "",
    cta_label_en: "",
    cta_label_ar: "",
    cta_href: "",
    status: "draft",
    sort_order: 0,
  };
}

function fromRecord(record: PortalContentBlockRecord): BlockFormState {
  return {
    section: record.section,
    key: record.key,
    title_en: record.title_en,
    title_ar: record.title_ar ?? "",
    body_en: record.body_en,
    body_ar: record.body_ar ?? "",
    cta_label_en: record.cta_label_en ?? "",
    cta_label_ar: record.cta_label_ar ?? "",
    cta_href: record.cta_href ?? "",
    status: record.status as BlockFormState["status"],
    sort_order: record.sort_order,
  };
}

export function PortalContentBlockManager({
  locale,
  blocks,
}: PortalContentBlockManagerProps) {
  const copy = tenantAdminCopy(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id ?? null);
  const [form, setForm] = useState<BlockFormState>(
    blocks[0] ? fromRecord(blocks[0]) : emptyBlock(),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRecord = useMemo(
    () => blocks.find((item) => item.id === selectedId) ?? null,
    [blocks, selectedId],
  );

  function loadRecord(record: PortalContentBlockRecord | null) {
    setSelectedId(record?.id ?? null);
    setForm(record ? fromRecord(record) : emptyBlock());
    setMessage(null);
    setError(null);
  }

  function handleSave() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await submitAdminJson<PortalContentBlockRecord>(
        selectedId ? `portal-content-blocks/${selectedId}` : "portal-content-blocks",
        selectedId ? "PUT" : "POST",
        {
          ...form,
          title_ar: form.title_ar || null,
          body_ar: form.body_ar || null,
          cta_label_en: form.cta_label_en || null,
          cta_label_ar: form.cta_label_ar || null,
          cta_href: form.cta_href || null,
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
      const result = await deleteAdminResource(`portal-content-blocks/${selectedId}`);

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
            <p className="dashboard-kicker">{copy.content.blocksTitle}</p>
            <h2 className="mt-2 text-xl font-semibold text-[#0a1628]">
              {copy.blocks.pageTitle}
            </h2>
          </div>
          <Button variant="outline" onClick={() => loadRecord(null)}>
            {copy.common.createNew}
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          {blocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-[#faf9f5]/65 p-4 text-sm text-muted">
              {copy.common.emptyTitle}
            </div>
          ) : (
            blocks.map((block) => {
              const active = block.id === selectedId;

              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => loadRecord(block)}
                  className={[
                    "rounded-2xl border px-4 py-4 text-start transition",
                    active
                      ? "border-[#bfd7ff] bg-[#eff6ff]"
                      : "border-line bg-[#faf9f5]/70 hover:bg-[#f4f8ff]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#0a1628]">
                      {localizedValue(locale, block.title_en, block.title_ar)}
                    </p>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      {copy.blocks.sectionLabels[
                        block.section as keyof typeof copy.blocks.sectionLabels
                      ] ?? block.section}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#5f7389]">{block.key}</p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <article className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.blocks.section}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.section}
              onChange={(event) =>
                setForm((current) => ({ ...current, section: event.target.value }))
              }
            >
              {Object.entries(copy.blocks.sectionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.blocks.key}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.key}
              onChange={(event) =>
                setForm((current) => ({ ...current, key: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.common.titleEn}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.title_en}
              onChange={(event) =>
                setForm((current) => ({ ...current, title_en: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.common.titleAr}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              dir="rtl"
              value={form.title_ar}
              onChange={(event) =>
                setForm((current) => ({ ...current, title_ar: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.common.bodyEn}</span>
            <textarea
              className="min-h-32 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.body_en}
              onChange={(event) =>
                setForm((current) => ({ ...current, body_en: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.common.bodyAr}</span>
            <textarea
              className="min-h-32 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              dir="rtl"
              value={form.body_ar}
              onChange={(event) =>
                setForm((current) => ({ ...current, body_ar: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.blocks.ctaLabelEn}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.cta_label_en}
              onChange={(event) =>
                setForm((current) => ({ ...current, cta_label_en: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.blocks.ctaLabelAr}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              dir="rtl"
              value={form.cta_label_ar}
              onChange={(event) =>
                setForm((current) => ({ ...current, cta_label_ar: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.blocks.ctaHref}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.cta_href}
              onChange={(event) =>
                setForm((current) => ({ ...current, cta_href: event.target.value }))
              }
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
                  status: event.target.value as BlockFormState["status"],
                }))
              }
            >
              <option value="draft">{copy.statuses.draft}</option>
              <option value="published">{copy.statuses.published}</option>
              <option value="archived">{copy.statuses.archived}</option>
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
