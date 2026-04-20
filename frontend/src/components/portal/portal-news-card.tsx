import Link from "next/link";

import { portalTheme } from "@/components/portal/portal-theme";

export type PortalNewsItem = {
  id: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
};

type PortalNewsCardProps = {
  kicker: string;
  title: string;
  description: string;
  providerLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  readMoreLabel: string;
  viewAllLabel: string;
  viewAllHref: string;
  items?: PortalNewsItem[];
  fallbackItems: PortalNewsItem[];
};

export function PortalNewsCard({
  kicker,
  title,
  description,
  providerLabel,
  emptyTitle,
  emptyDescription,
  readMoreLabel,
  viewAllLabel,
  viewAllHref,
  items = [],
  fallbackItems,
}: PortalNewsCardProps) {
  const visibleItems = items.length > 0
    ? items.slice(0, 2)
    : fallbackItems.slice(0, 2);
  const showEmptyState = visibleItems.length === 0;

  return (
    <section id="news" className="mx-auto mt-16 max-w-[960px]">
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
        <div className="grid gap-4 md:grid-cols-2">
          {visibleItems.map((item) => (
            <article
              key={item.id}
              className="rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(102,118,151,0.16)_0%,rgba(89,103,133,0.14)_100%)] px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              {item.publishedAt ? (
                <div className="flex items-center gap-2 text-[13px] text-[#eef3ff]">
                  <span className="inline-flex h-3 w-3 items-center justify-center text-[#dce6ff]">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h12v14H6zM8 2h2v4H8zm6 0h2v4h-2z" />
                    </svg>
                  </span>
                  <span>{item.publishedAt}</span>
                </div>
              ) : null}
              <h3 className="mt-4 text-[22px] font-normal tracking-[-0.02em] text-white">
                {item.title}
              </h3>
              {item.excerpt ? (
                <p className="mt-3 text-[14px] leading-8 text-[#d9e2f5]">
                  {item.excerpt}
                </p>
              ) : null}
              <Link
                className="mt-6 inline-flex min-h-[36px] items-center justify-center rounded-[2px] bg-[#dbe5ff] px-4 text-[13px] font-medium text-[#2e5fc7]"
                href={viewAllHref}
              >
                {readMoreLabel}
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
