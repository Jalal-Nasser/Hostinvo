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
  type PortalFooterLinkRecord,
} from "@/lib/tenant-admin";

type PortalFooterLinkManagerProps = {
  locale: string;
  links: PortalFooterLinkRecord[];
};

type FooterLinkFormState = {
  group_key: string;
  label_en: string;
  label_ar: string;
  href: string;
  is_visible: boolean;
  open_in_new_tab: boolean;
  sort_order: number;
};

function emptyLink(): FooterLinkFormState {
  return {
    group_key: "support",
    label_en: "",
    label_ar: "",
    href: "",
    is_visible: true,
    open_in_new_tab: false,
    sort_order: 0,
  };
}

function fromRecord(record: PortalFooterLinkRecord): FooterLinkFormState {
  return {
    group_key: record.group_key,
    label_en: record.label_en,
    label_ar: record.label_ar ?? "",
    href: record.href,
    is_visible: record.is_visible,
    open_in_new_tab: record.open_in_new_tab,
    sort_order: record.sort_order,
  };
}

export function PortalFooterLinkManager({
  locale,
  links,
}: PortalFooterLinkManagerProps) {
  const copy = tenantAdminCopy(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(links[0]?.id ?? null);
  const [form, setForm] = useState<FooterLinkFormState>(
    links[0] ? fromRecord(links[0]) : emptyLink(),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRecord = useMemo(
    () => links.find((item) => item.id === selectedId) ?? null,
    [links, selectedId],
  );

  function loadRecord(record: PortalFooterLinkRecord | null) {
    setSelectedId(record?.id ?? null);
    setForm(record ? fromRecord(record) : emptyLink());
    setMessage(null);
    setError(null);
  }

  function handleSave() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await submitAdminJson<PortalFooterLinkRecord>(
        selectedId ? `portal-footer-links/${selectedId}` : "portal-footer-links",
        selectedId ? "PUT" : "POST",
        {
          ...form,
          label_ar: form.label_ar || null,
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
      const result = await deleteAdminResource(`portal-footer-links/${selectedId}`);

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
            <p className="dashboard-kicker">{copy.content.footerLinksTitle}</p>
            <h2 className="mt-2 text-xl font-semibold text-[#0a1628]">
              {copy.footer.pageTitle}
            </h2>
          </div>
          <Button variant="outline" onClick={() => loadRecord(null)}>
            {copy.common.createNew}
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          {links.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-[#faf9f5]/65 p-4 text-sm text-muted">
              {copy.common.emptyTitle}
            </div>
          ) : (
            links.map((link) => {
              const active = link.id === selectedId;

              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => loadRecord(link)}
                  className={[
                    "rounded-2xl border px-4 py-4 text-start transition",
                    active
                      ? "border-[#bfd7ff] bg-[#eff6ff]"
                      : "border-line bg-[#faf9f5]/70 hover:bg-[#f4f8ff]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#0a1628]">
                      {localizedValue(locale, link.label_en, link.label_ar)}
                    </p>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      {copy.footer.groupLabels[
                        link.group_key as keyof typeof copy.footer.groupLabels
                      ] ?? link.group_key}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm text-[#5f7389]">{link.href}</p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <article className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.footer.groupKey}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.group_key}
              onChange={(event) =>
                setForm((current) => ({ ...current, group_key: event.target.value }))
              }
            >
              {Object.entries(copy.footer.groupLabels).map(([value, label]) => (
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

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.common.labelEn}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.label_en}
              onChange={(event) =>
                setForm((current) => ({ ...current, label_en: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{copy.common.labelAr}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              dir="rtl"
              value={form.label_ar}
              onChange={(event) =>
                setForm((current) => ({ ...current, label_ar: event.target.value }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{copy.footer.href}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              value={form.href}
              onChange={(event) =>
                setForm((current) => ({ ...current, href: event.target.value }))
              }
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_visible: event.target.checked }))
              }
            />
            <span>{copy.footer.isVisible}</span>
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.open_in_new_tab}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  open_in_new_tab: event.target.checked,
                }))
              }
            />
            <span>{copy.footer.openInNewTab}</span>
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
