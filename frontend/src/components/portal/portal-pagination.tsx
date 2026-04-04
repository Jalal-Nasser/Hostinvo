import Link from "next/link";

import { portalTheme } from "@/components/portal/portal-theme";
import { localePath } from "@/lib/auth";

type PortalPaginationProps = {
  locale: string;
  path: string;
  currentPage: number;
  lastPage: number;
  total: number;
  query?: Record<string, string | undefined>;
  previousLabel: string;
  nextLabel: string;
  summaryLabel: string;
};

function buildVisiblePages(currentPage: number, lastPage: number): number[] {
  const candidatePages = new Set<number>([1, lastPage, currentPage - 1, currentPage, currentPage + 1]);

  return Array.from(candidatePages)
    .filter((page) => page >= 1 && page <= lastPage)
    .sort((left, right) => left - right);
}

export function PortalPagination({
  locale,
  path,
  currentPage,
  lastPage,
  total,
  query = {},
  previousLabel,
  nextLabel,
  summaryLabel,
}: PortalPaginationProps) {
  if (lastPage <= 1) {
    return null;
  }

  function hrefForPage(page: number): string {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value && key !== "page") {
        params.set(key, value);
      }
    });

    if (page > 1) {
      params.set("page", String(page));
    }

    const queryString = params.toString();

    return queryString
      ? `${localePath(locale, path)}?${queryString}`
      : localePath(locale, path);
  }

  const visiblePages = buildVisiblePages(currentPage, lastPage);

  return (
    <nav
      aria-label={summaryLabel}
      className={[portalTheme.surfaceClass, "flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"].join(" ")}
    >
      <p className="text-sm text-[#aebad4]">
        {summaryLabel.replace("{current}", String(currentPage)).replace("{last}", String(lastPage)).replace("{total}", String(total))}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {currentPage > 1 ? (
          <Link className={portalTheme.secondaryButtonClass} href={hrefForPage(currentPage - 1)}>
            {previousLabel}
          </Link>
        ) : (
          <span
            className={[
              portalTheme.secondaryButtonClass,
              "pointer-events-none opacity-45",
            ].join(" ")}
          >
            {previousLabel}
          </span>
        )}

        {visiblePages.map((page) => {
          const active = page === currentPage;

          return (
            <Link
              key={page}
              className={[
                active ? portalTheme.primaryButtonClass : portalTheme.secondaryButtonClass,
                "min-w-11 ps-0 pe-0",
              ].join(" ")}
              href={hrefForPage(page)}
            >
              {page}
            </Link>
          );
        })}

        {currentPage < lastPage ? (
          <Link className={portalTheme.secondaryButtonClass} href={hrefForPage(currentPage + 1)}>
            {nextLabel}
          </Link>
        ) : (
          <span
            className={[
              portalTheme.secondaryButtonClass,
              "pointer-events-none opacity-45",
            ].join(" ")}
          >
            {nextLabel}
          </span>
        )}
      </div>
    </nav>
  );
}
