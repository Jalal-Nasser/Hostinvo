import Image from "next/image";
import Link from "next/link";

import type { PortalSection, PortalSectionKey } from "@/components/portal/portal-navigation";
import { PortalRailIcon } from "@/components/portal/portal-icons";
import { portalTheme } from "@/components/portal/portal-theme";
import { localePath } from "@/lib/auth";

type PortalRailNavProps = {
  locale: string;
  sections: PortalSection[];
  activeSectionKey: PortalSectionKey;
  mobile?: boolean;
  onSectionHover?: (key: PortalSectionKey) => void;
  onSectionFocus?: (key: PortalSectionKey) => void;
  logoSrc?: string | null;
  logoAlt?: string;
};

function joinClasses(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

function railLogoInitials(value: string): string {
  const initials = value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "CP";
}

export function PortalRailNav({
  locale,
  sections,
  activeSectionKey,
  mobile = false,
  onSectionHover,
  onSectionFocus,
  logoSrc,
  logoAlt = "Client portal",
}: PortalRailNavProps) {
  if (mobile) {
    return (
      <nav className={joinClasses(portalTheme.surfaceClass, "grid grid-cols-2 gap-2 p-2 sm:grid-cols-4")}>
        {sections.map((section) => {
          const active = section.key === activeSectionKey;

          return (
            <Link
              key={section.key}
              href={section.href}
              className={joinClasses(
                "flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 text-center transition",
                active
                  ? "border-[rgba(74,149,255,0.32)] bg-[linear-gradient(180deg,rgba(59,130,246,0.18)_0%,rgba(59,130,246,0.06)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-[rgba(148,163,184,0.08)] bg-[rgba(255,255,255,0.02)] text-[#a5b4cf] hover:border-[rgba(148,163,184,0.16)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white",
              )}
            >
              <span
                className={joinClasses(
                  "inline-flex h-10 w-10 items-center justify-center rounded-lg transition",
                  active
                    ? "bg-[linear-gradient(180deg,rgba(74,149,255,0.32)_0%,rgba(47,122,238,0.16)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "bg-[rgba(255,255,255,0.04)]",
                )}
              >
                <PortalRailIcon active={active} icon={section.icon} />
              </span>
              <span className="text-[11px] font-semibold leading-4 tracking-[0.06em]">{section.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className={portalTheme.railClass}>
      <Link
        href={localePath(locale, "/portal")}
        className="inline-flex items-center justify-center rounded-xl border border-[rgba(148,163,184,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        aria-label={logoAlt}
      >
        {logoSrc ? (
          logoSrc.startsWith("/") ? (
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={44}
              height={44}
              className="h-10 w-10 object-contain"
              priority
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={logoAlt}
              className="h-10 w-10 object-contain"
            />
          )
        ) : (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] text-[11px] font-bold uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            {railLogoInitials(logoAlt)}
          </span>
        )}
      </Link>

      <nav className="mt-6 flex w-full flex-1 flex-col items-center gap-2 px-2.5">
        {sections.map((section) => {
          const active = section.key === activeSectionKey;

          return (
            <Link
              key={section.key}
              href={section.href}
              onFocus={() => onSectionFocus?.(section.key)}
              onMouseEnter={() => onSectionHover?.(section.key)}
              className={joinClasses(
                "group relative flex w-full flex-col items-center justify-center gap-2 rounded-xl px-1.5 py-3 text-center transition",
                active
                  ? "bg-[linear-gradient(180deg,rgba(74,149,255,0.22)_0%,rgba(47,122,238,0.1)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-[#a5b4cf] hover:bg-[rgba(255,255,255,0.04)] hover:text-white",
              )}
            >
              {active ? (
                <span className="absolute start-0 top-1/2 h-10 w-0.5 -translate-y-1/2 rounded-e-full bg-[#60a5fa]" />
              ) : null}
              <span
                className={joinClasses(
                  "inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl transition",
                  active
                    ? "bg-[linear-gradient(180deg,rgba(74,149,255,0.28)_0%,rgba(47,122,238,0.12)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "bg-[rgba(255,255,255,0.04)] text-[#cdd7ed] group-hover:bg-[rgba(255,255,255,0.07)] group-hover:text-white",
                )}
              >
                <PortalRailIcon active={active} icon={section.icon} />
              </span>
              <span className="text-[10.5px] font-semibold leading-3 tracking-[0.04em]">{section.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
