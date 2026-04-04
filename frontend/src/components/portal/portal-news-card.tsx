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
          <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.02em] text-white">{title}</h2>
        </div>
        {viewAllHref && viewAllLabel ? (
          <Link className={portalTheme.secondaryButtonClass} href={viewAllHref}>
            {viewAllLabel}
          </Link>
        ) : null}
      </div>

      <article className={[portalTheme.surfaceClass, "ps-6 pe-6 py-6 md:ps-7 md:pe-7 md:py-7"].join(" ")}>
        <p className="max-w-2xl text-sm leading-7 text-[#aebad4]">{description}</p>
        {items.length === 0 ? (
          <div className="mt-5 rounded-[12px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.015)_100%)] ps-5 pe-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <h3 className="text-[1.2rem] font-medium tracking-[-0.02em] text-white">
              {emptyTitle}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-[12px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.015)_100%)] ps-5 pe-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              >
                {item.publishedAt ? (
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8ea4ca]">
                    {item.publishedAt}
                  </p>
                ) : null}
                <h3 className="mt-2 text-[1.2rem] font-medium tracking-[-0.02em] text-white">
                  {item.title}
                </h3>
                {item.excerpt ? (
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">
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
