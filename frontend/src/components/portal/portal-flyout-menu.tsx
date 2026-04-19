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
            alt={branding?.portalName || section.title}
            fallbackText={!branding?.logoUrl ? (branding?.portalName || section.title) : undefined}
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
      <div className="flex h-full flex-col px-4 pb-6 pt-6">
        <div className="rounded-xl border border-[rgba(148,163,184,0.12)] bg-[linear-gradient(180deg,rgba(59,130,246,0.18)_0%,rgba(30,41,59,0.2)_60%,rgba(17,24,41,0)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className={portalTheme.sectionKickerClass}>{section.label}</p>
          <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.02em] text-white">
            {section.title}
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-5 text-[#a5b4cf]">{section.description}</p>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="grid gap-0.5">
            {section.items.map((item) => {
              const active = explicitActiveLabel
                ? item.label === explicitActiveLabel
                : isItemActive(currentPath, item.href, item.matchPaths);

              return (
                <Link
                  key={`${section.key}-${item.label}`}
                  href={item.href}
                  className={joinClasses(
                    "relative flex min-h-10 items-center rounded-lg px-3 py-2 text-[13px] transition",
                    active
                      ? "bg-[rgba(59,130,246,0.12)] font-semibold text-white"
                      : "text-[#b8c3da] hover:bg-[rgba(255,255,255,0.04)] hover:text-white",
                  )}
                >
                  {active ? (
                    <span className="absolute start-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-e-full bg-[#60a5fa]" />
                  ) : null}
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
