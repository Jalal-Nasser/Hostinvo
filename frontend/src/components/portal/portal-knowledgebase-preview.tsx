import Link from "next/link";

import { portalTheme } from "@/components/portal/portal-theme";

export type PortalKnowledgebasePreviewItem = {
  id: string;
  title: string;
  excerpt: string | null;
  href: string;
};

type PortalKnowledgebasePreviewProps = {
  kicker: string;
  title: string;
  description: string;
  providerLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  openLabel: string;
  viewAllLabel: string;
  viewAllHref: string;
  items: PortalKnowledgebasePreviewItem[];
  fallbackItems: PortalKnowledgebasePreviewItem[];
};

export function PortalKnowledgebasePreview({
  kicker,
  title,
  description,
  providerLabel,
  emptyTitle,
  emptyDescription,
  openLabel,
  viewAllLabel,
  viewAllHref,
  items,
  fallbackItems,
}: PortalKnowledgebasePreviewProps) {
  const visibleItems = items.length > 0
    ? items.slice(0, 3)
    : fallbackItems.slice(0, 3);
  const showEmptyState = visibleItems.length === 0;

  return (
    <section className="mx-auto mt-16 max-w-[960px]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className={portalTheme.sectionKickerClass}>{kicker}</p>
          <h2 className="mt-2 text-[20px] font-normal tracking-[-0.02em] text-white md:text-[22px]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#cbd6eb]">
            {description}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[#b8c5e2]">
            {providerLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className={portalTheme.secondaryButtonClass} href={viewAllHref}>
            {viewAllLabel}
          </Link>
        </div>
      </div>

      {showEmptyState ? (
        <div className={[portalTheme.noteClass, "mb-5"].join(" ")}>
          <p className="font-semibold text-white">{emptyTitle}</p>
          <p className="mt-1 text-[#cbd6eb]">{emptyDescription}</p>
        </div>
      ) : null}

      {visibleItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {visibleItems.map((item) => (
            <article
              className={[portalTheme.subtleSurfaceClass, "flex min-h-[190px] flex-col p-5"].join(" ")}
              key={item.id}
            >
              <h3 className="text-lg font-semibold leading-7 text-white">
                {item.title}
              </h3>
              {item.excerpt ? (
                <p className="mt-3 flex-1 text-sm leading-7 text-[#cbd6eb]">
                  {item.excerpt}
                </p>
              ) : (
                <div className="flex-1" />
              )}
              <Link className="mt-5 text-sm font-semibold text-[#dbe7ff]" href={item.href}>
                {openLabel}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <article className={[portalTheme.surfaceClass, "px-6 py-7"].join(" ")}>
          <h3 className="text-lg font-semibold text-white">{emptyTitle}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#cbd6eb]">
            {emptyDescription}
          </p>
        </article>
      )}
    </section>
  );
}
