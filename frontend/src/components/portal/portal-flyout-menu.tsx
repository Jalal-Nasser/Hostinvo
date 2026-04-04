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
        <div className="flex items-center justify-between gap-3 border-b border-[rgba(104,123,158,0.12)] pb-4">
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
            alt={branding?.portalName || "Hostinvo"}
          />
        </div>

        <div className="mt-4 grid gap-1.5">
          {section.items.map((item) => {
                const active = explicitActiveLabel
                  ? item.label === explicitActiveLabel
                  : isItemActive(currentPath, item.href, item.matchPaths);

                return (
                  <Link
                    key={`${section.key}-${item.label}`}
                    href={item.href}
                    className={joinClasses(
                      "flex min-h-11 items-center rounded-[10px] ps-3 pe-3 py-2.5 text-sm transition",
                      active
                        ? "bg-[linear-gradient(180deg,rgba(64,127,255,0.16)_0%,rgba(64,127,255,0.08)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "text-[#b8c6df] hover:bg-[rgba(255,255,255,0.05)] hover:text-white",
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
      <div className="flex h-full flex-col ps-5 pe-5 pt-6 pb-6">
        <div className="rounded-[16px] bg-[linear-gradient(180deg,rgba(46,125,255,0.22)_0%,rgba(51,86,150,0.08)_54%,rgba(255,255,255,0)_100%)] ps-4 pe-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className={portalTheme.sectionKickerClass}>
            {section.label}
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white">
            {section.title}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[#aab8d4]">{section.description}</p>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto">
          <div className="grid gap-1.5">
            {section.items.map((item) => {
              const active = explicitActiveLabel
                ? item.label === explicitActiveLabel
                : isItemActive(currentPath, item.href, item.matchPaths);

              return (
                <Link
                  key={`${section.key}-${item.label}`}
                  href={item.href}
                  className={joinClasses(
                    "group flex min-h-12 items-center rounded-[12px] ps-2 pe-2 py-1.5 text-[13px] transition",
                    active
                      ? "bg-[linear-gradient(180deg,rgba(66,128,245,0.14)_0%,rgba(66,128,245,0.06)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "text-[#c6d2e7] hover:bg-[rgba(255,255,255,0.028)] hover:text-white",
                  )}
                >
                  <span
                    className={joinClasses(
                      "w-full rounded-[10px] ps-3 pe-3 py-2.5 transition",
                      active ? "bg-[rgba(70,126,246,0.06)]" : "group-hover:bg-[rgba(255,255,255,0.018)]",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
