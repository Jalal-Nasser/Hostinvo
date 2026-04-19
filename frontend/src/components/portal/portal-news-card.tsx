import Link from "next/link";

import { portalTheme } from "@/components/portal/portal-theme";

type PortalNewsItem = {
  id: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
};

type PortalNewsCardProps = {
  kicker: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  items?: PortalNewsItem[];
  viewAllHref?: string;
  viewAllLabel?: string;
};

export function PortalNewsCard({
  kicker,
  title,
  description,
  emptyTitle,
  emptyDescription,
  items = [],
  viewAllHref,
  viewAllLabel,
}: PortalNewsCardProps) {
  return (
    <section id="news">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className={portalTheme.sectionKickerClass}>{kicker}</p>
          <h2 className="mt-1.5 text-[1.35rem] font-semibold tracking-[-0.02em] text-white md:text-[1.5rem]">
            {title}
          </h2>
        </div>
        {viewAllHref && viewAllLabel ? (
          <Link className={portalTheme.secondaryButtonClass} href={viewAllHref}>
            {viewAllLabel}
          </Link>
        ) : null}
      </div>

      <article className={[portalTheme.surfaceClass, "px-6 py-5 md:px-7 md:py-6"].join(" ")}>
        <p className="max-w-2xl text-[13px] leading-6 text-[#a5b4cf]">{description}</p>
        {items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-[rgba(148,163,184,0.1)] bg-[rgba(255,255,255,0.02)] px-5 py-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(74,149,255,0.14)] text-[#93c5fd]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 11h2v6h-2zm0-4h2v2h-2zm1-5a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-white">{emptyTitle}</h3>
                <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-[#a5b4cf]">
                  {emptyDescription}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-[rgba(148,163,184,0.08)] rounded-xl border border-[rgba(148,163,184,0.1)] bg-[rgba(255,255,255,0.015)]">
            {items.map((item) => (
              <article key={item.id} className="px-5 py-4 transition hover:bg-[rgba(255,255,255,0.025)]">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8ea4ca]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa]" />
                  {item.publishedAt ? item.publishedAt : null}
                </div>
                <h3 className="mt-2 text-[15px] font-semibold tracking-[-0.01em] text-white">
                  {item.title}
                </h3>
                {item.excerpt ? (
                  <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-[#a5b4cf]">
                    {item.excerpt}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
