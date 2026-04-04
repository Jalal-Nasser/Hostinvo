"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import {
  submitAdminJson,
  type PortalSurfaceEntry,
  type PortalSurfaceSettings,
} from "@/lib/tenant-admin";

type PortalSurfaceFormProps = {
  locale: string;
  initialSurface: PortalSurfaceSettings;
};

type SurfaceGroupKey = "navigation" | "home_sections" | "home_cards";

export function PortalSurfaceForm({
  locale,
  initialSurface,
}: PortalSurfaceFormProps) {
  const copy = tenantAdminCopy(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navigation, setNavigation] = useState(initialSurface.navigation);
  const [homeSections, setHomeSections] = useState(initialSurface.home_sections);
  const [homeCards, setHomeCards] = useState(
    initialSurface.home_cards.map((entry) =>
      entry.key === "support" ? { ...entry, key: "support_card" } : entry,
    ),
  );
  const [contentSources, setContentSources] = useState(initialSurface.content_sources);

  function updateEntry(
    group: SurfaceGroupKey,
    index: number,
    updater: (entry: PortalSurfaceEntry) => PortalSurfaceEntry,
  ) {
    const apply = (entries: PortalSurfaceEntry[]) =>
      entries.map((entry, entryIndex) =>
        entryIndex === index ? updater(entry) : entry,
      );

    if (group === "navigation") {
      setNavigation((current) => apply(current));
      return;
    }

    if (group === "home_sections") {
      setHomeSections((current) => apply(current));
      return;
    }

    setHomeCards((current) => apply(current));
  }

  function renderEntries(
    title: string,
    group: SurfaceGroupKey,
    entries: PortalSurfaceEntry[],
  ) {
    return (
      <article className="glass-card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <div className="mt-5 grid gap-4">
          {entries.map((entry, index) => (
            <div key={entry.key} className="rounded-2xl border border-line bg-[#faf9f5]/75 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {copy.surface.entries[entry.key as keyof typeof copy.surface.entries] ?? entry.key}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-muted">{entry.key}</p>
                </div>

                <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={entry.visible}
                    onChange={(event) =>
                      updateEntry(group, index, (current) => ({
                        ...current,
                        visible: event.target.checked,
                      }))
                    }
                  />
                  <span>{copy.common.visibleLabel}</span>
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{copy.common.orderLabel}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    type="number"
                    value={entry.order}
                    onChange={(event) =>
                      updateEntry(group, index, (current) => ({
                        ...current,
                        order: Number(event.target.value || "0"),
                      }))
                    }
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{copy.common.labelEn}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    value={entry.label_en ?? ""}
                    onChange={(event) =>
                      updateEntry(group, index, (current) => ({
                        ...current,
                        label_en: event.target.value || null,
                      }))
                    }
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>{copy.common.labelAr}</span>
                  <input
                    className="rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    value={entry.label_ar ?? ""}
                    onChange={(event) =>
                      updateEntry(group, index, (current) => ({
                        ...current,
                        label_ar: event.target.value || null,
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </article>
    );
  }

  function handleSave() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const payload: PortalSurfaceSettings = {
        navigation,
        home_sections: homeSections,
        home_cards: homeCards.map((entry) =>
          entry.key === "support_card" ? { ...entry, key: "support" } : entry,
        ),
        content_sources: contentSources,
      };

      const result = await submitAdminJson<PortalSurfaceSettings>(
        "settings/portal-surface",
        "PUT",
        payload,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(copy.surface.saved);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      {renderEntries(copy.surface.navigation, "navigation", navigation)}
      {renderEntries(copy.surface.homeSections, "home_sections", homeSections)}
      {renderEntries(copy.surface.homeCards, "home_cards", homeCards)}

      <section className="glass-card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">{copy.surface.contentSources}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {Object.entries(contentSources).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-[#faf9f5]/75 px-4 py-4 text-sm font-medium text-foreground"
            >
              <span>
                {copy.surface.sourceLabels[key as keyof typeof copy.surface.sourceLabels] ?? key}
              </span>
              <input
                type="checkbox"
                checked={value}
                onChange={(event) =>
                  setContentSources((current) => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
              />
            </label>
          ))}
        </div>
      </section>

      {message ? <StatusBanner tone="success" message={message} /> : null}
      {error ? <StatusBanner tone="error" message={error} /> : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={isPending} onClick={handleSave}>
          {isPending ? copy.common.saving : copy.common.saveChanges}
        </Button>
      </div>
    </div>
  );
}
