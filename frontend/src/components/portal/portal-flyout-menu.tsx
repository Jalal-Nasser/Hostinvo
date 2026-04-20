import Link from "next/link";

import type { PortalSection } from "@/components/portal/portal-navigation";
import { portalTheme } from "@/components/portal/portal-theme";
import { BrandLogo } from "@/components/layout/brand-logo";
import { localePath } from "@/lib/auth";

type PortalFlyoutMenuProps = {
  locale: string;
  currentPath: string;
  section: PortalSection;
  mobile?: boolean;
  branding?: {
    logoUrl?: string | null;
    portalName?: string | null;
  } | null;
};

function joinClasses(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

function matchesCurrentPath(currentPath: string, path: string): boolean {
  return currentPath === path || currentPath.startsWith(`${path}/`);
}

function isItemActive(currentPath: string, href: string, matchPaths?: string[]): boolean {
  if (matchPaths?.some((path) => matchesCurrentPath(currentPath, path))) {
    return true;
  }

  if (href.includes("#")) {
    return false;
  }

  const normalizedHref = href.replace(/^\/(en|ar)/, "").split("#")[0];

  if (normalizedHref === "/portal" && currentPath === "/portal") {
    return true;
  }

  if (normalizedHref !== "/portal" && normalizedHref.length > 0) {
    return matchesCurrentPath(currentPath, normalizedHref);
  }

  return false;
}

export function PortalFlyoutMenu({
  locale,
  currentPath,
  section,
  mobile = false,
  branding,
}: PortalFlyoutMenuProps) {
  const explicitActiveLabel =
    section.items.find((item) =>
      item.matchPaths?.some((path) => matchesCurrentPath(currentPath, path)),
    )?.label ?? null;

  if (mobile) {
    return (
      <section className={joinClasses(portalTheme.surfaceClass, "p-4")}>
        <div className="flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] pb-4">
          <div>
            <p className={portalTheme.sectionKickerClass}>
              {section.label}
            </p>
            <h2 className="mt-2 text-base font-semibold text-white">{section.title}</h2>
          </div>
          <BrandLogo
            href={localePath(locale, "/portal")}
            className="w-[102px] shrink-0"
            src={branding?.logoUrl}
            alt={branding?.portalName || section.title}
            fallbackText={!branding?.logoUrl ? (branding?.portalName || section.title) : undefined}
          />
        </div>

        <div className="mt-4 grid gap-0">
          {section.items.map((item) => {
            const active = explicitActiveLabel
              ? item.label === explicitActiveLabel
              : isItemActive(currentPath, item.href, item.matchPaths);

            return (
              <Link
                key={`${section.key}-${item.label}`}
                href={item.href}
                className={joinClasses(
                  "flex min-h-11 items-center border-b border-[rgba(255,255,255,0.06)] ps-3 pe-3 py-2.5 text-sm transition",
                  active
                    ? "bg-[linear-gradient(90deg,rgba(78,155,255,0.22)_0%,rgba(78,155,255,0.08)_100%)] text-white"
                    : "text-[#d7e3fa] hover:bg-[rgba(255,255,255,0.05)] hover:text-white",
                )}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <aside className={joinClasses(portalTheme.flyoutClass, "hidden lg:block")}>
      <div className="flex h-full flex-col px-0 pb-6 pt-4">
        <div className="bg-[linear-gradient(180deg,rgba(38,133,245,0.3)_0%,rgba(56,67,89,0)_100%)] px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d7e4ff]">{section.label}</p>
          <h2 className="mt-2 text-[15px] font-semibold tracking-[-0.02em] text-white">
            {section.title}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-0">
            {section.items.map((item) => {
              const active = explicitActiveLabel
                ? item.label === explicitActiveLabel
                : isItemActive(currentPath, item.href, item.matchPaths);

              return (
                <Link
                  key={`${section.key}-${item.label}`}
                  href={item.href}
                  className={joinClasses(
                    "relative flex min-h-[46px] items-center border-b border-[rgba(255,255,255,0.06)] px-6 py-2 text-[13px] transition",
                    active
                      ? "bg-[linear-gradient(90deg,rgba(78,155,255,0.22)_0%,rgba(78,155,255,0.08)_100%)] font-semibold text-white"
                      : "text-[#eef3ff] hover:bg-[rgba(255,255,255,0.04)] hover:text-white",
                  )}
                >
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
