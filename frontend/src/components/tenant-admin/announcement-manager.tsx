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
  type AnnouncementRecord,
} from "@/lib/tenant-admin";

type AnnouncementManagerProps = {
  locale: string;
  initialAnnouncements: AnnouncementRecord[];
};

type AnnouncementFormState = {
  title_en: string;
  title_ar: string;
  slug: string;
  excerpt_en: string;
  excerpt_ar: string;
  body_en: string;
  body_ar: string;
  status: "draft" | "published";
  is_featured: boolean;
  sort_order: number;
  published_at: string;
};

function emptyAnnouncement(): AnnouncementFormState {
  return {
    title_en: "",
    title_ar: "",
    slug: "",
    excerpt_en: "",
    excerpt_ar: "",
    body_en: "",
    body_ar: "",
    status: "draft",
    is_featured: false,
    sort_order: 0,
    published_at: "",
  };
}

function fromRecord(record: AnnouncementRecord): AnnouncementFormState {
  return {
    title_en: record.title_en,
    title_ar: record.title_ar ?? "",
    slug: record.slug,
    excerpt_en: record.excerpt_en ?? "",
    excerpt_ar: record.excerpt_ar ?? "",
    body_en: record.body_en,
    body_ar: record.body_ar ?? "",
    status: record.status as "draft" | "published",
    is_featured: record.is_featured,
    sort_order: record.sort_order,
    published_at: record.published_at ? record.published_at.slice(0, 16) : "",
  };
}

export function AnnouncementManager({
  locale,
  initialAnnouncements,
}: AnnouncementManagerProps) {
  const copy = tenantAdminCopy(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(
    initialAnnouncements[0]?.id ?? null,
  );
  const [form, setForm] = useState<AnnouncementFormState>(
    initialAnnouncements[0] ? fromRecord(initialAnnouncements[0]) : emptyAnnouncement(),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRecord = useMemo(
    () => initialAnnouncements.find((record) => record.id === selectedId) ?? null,
    [initialAnnouncements, selectedId],
  );

  function loadRecord(record: AnnouncementRecord | null) {
    setSelectedId(record?.id ?? null);
    setForm(record ? fromRecord(record) : emptyAnnouncement());
    setMessage(null);
    setError(null);
  }

  function handleSave() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await submitAdminJson<AnnouncementRecord>(
        selectedId ? `announcements/${selectedId}` : "announcements",
        selectedId ? "PUT" : "POST",
        {
          ...form,
          title_ar: form.title_ar || null,
          excerpt_en: form.excerpt_en || null,
          excerpt_ar: form.excerpt_ar || null,
          body_ar: form.body_ar || null,
          published_at: form.published_at || null,
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
      const result = await deleteAdminResource(`announcements/${selectedId}`);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(copy.common.deleteSuccess);
      setSelectedId(null);
      setForm(emptyAnnouncement());
      router.refresh();
    });
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="glass-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="dashboard-kicker">{copy.content.announcementsTitle}</p>
            <h2 className="mt-2 text-xl font-semibold text-[#0a1628]">
              {copy.announcements.pageTitle}
            </h2>
          </div>
          <Button variant="outline" onClick={() => loadRecord(null)}>
            {copy.common.createNew}
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          {initialAnnouncements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-[#faf9f5]/65 p-4 text-sm text-muted">
              {copy.common.emptyTitle}
            </div>
          ) : (
            initialAnnouncements.map((announcement) => {
              const active = announcement.id === selectedId;

              return (
                <button
                  key={announcement.id}
                  type="button"
                  onClick={() => loadRecord(announcement)}
                  className={[
                    "rounded-2xl border px-4 py-4 text-start transition",
                    active
                      ? "border-[#bfd7ff] bg-[#eff6ff]"
                      : "border-line bg-[#faf9f5]/70 hover:bg-[#f4f8ff]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#0a1628]">
                      {localizedValue(locale, announcement.title_en, announcement.title_ar)}
                    </p>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      {announcement.status === "published"
                        ? copy.statuses.published
                        : copy.statuses.draft}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#5f7389]">
                    {localizedValue(
                      locale,
                      announcement.excerpt_en,
                      announcement.excerpt_ar,
                    ) || announcement.slug}
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
                  status: event.target.value as "draft" | "published",
                }))
              }
            >
              <option value="draft">{copy.statuses.draft}</option>
              <option value="published">{copy.statuses.published}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.common.excerptEn}</span>
            <textarea
              className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.excerpt_en}
              onChange={(event) =>
                setForm((current) => ({ ...current, excerpt_en: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.common.excerptAr}</span>
            <textarea
              className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              dir="rtl"
              value={form.excerpt_ar}
              onChange={(event) =>
                setForm((current) => ({ ...current, excerpt_ar: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.common.bodyEn}</span>
            <textarea
              className="min-h-40 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.body_en}
              onChange={(event) => setForm((current) => ({ ...current, body_en: event.target.value }))}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.common.bodyAr}</span>
            <textarea
              className="min-h-40 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              dir="rtl"
              value={form.body_ar}
              onChange={(event) => setForm((current) => ({ ...current, body_ar: event.target.value }))}
            />
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

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.common.publishedAt}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              type="datetime-local"
              value={form.published_at}
              onChange={(event) =>
                setForm((current) => ({ ...current, published_at: event.target.value }))
              }
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-foreground md:col-span-2">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_featured: event.target.checked }))
              }
            />
            <span>{copy.common.featured}</span>
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
