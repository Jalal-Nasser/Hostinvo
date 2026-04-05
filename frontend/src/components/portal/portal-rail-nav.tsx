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
                "flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-[12px] border ps-3 pe-3 py-3 text-center transition",
                active
                  ? "border-[rgba(108,162,255,0.24)] bg-[linear-gradient(180deg,rgba(61,128,255,0.22)_0%,rgba(61,128,255,0.08)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-transparent bg-[rgba(255,255,255,0.03)] text-[#b8c7e0] hover:bg-[rgba(255,255,255,0.06)]",
              )}
            >
              <span
                className={joinClasses(
                  "inline-flex h-12 w-12 items-center justify-center rounded-[14px] transition",
                  active
                    ? "bg-[radial-gradient(circle_at_top,rgba(86,166,255,0.34)_0%,rgba(52,134,255,0.18)_58%,rgba(52,134,255,0.08)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "bg-[rgba(255,255,255,0.04)]",
                )}
              >
                <PortalRailIcon active={active} icon={section.icon} />
              </span>
              <span className="text-[11px] font-semibold leading-4 tracking-[0.08em]">{section.label}</span>
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
        className="inline-flex items-center justify-center rounded-[20px] border border-[rgba(110,128,158,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        aria-label={logoAlt}
      >
        {logoSrc ? (
          logoSrc.startsWith("/") ? (
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={54}
              height={54}
              className="h-[46px] w-[46px] object-contain"
              priority
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={logoAlt}
              className="h-[46px] w-[46px] object-contain"
            />
          )
        ) : (
          <span className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,rgba(74,128,232,0.22)_0%,rgba(39,59,104,0.18)_100%)] text-sm font-semibold uppercase tracking-[0.12em] text-[#eff5ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            {railLogoInitials(logoAlt)}
          </span>
        )}
      </Link>

      <nav className="mt-9 flex w-full flex-1 flex-col items-center gap-4 ps-3 pe-3">
        {sections.map((section) => {
          const active = section.key === activeSectionKey;

          return (
            <Link
              key={section.key}
              href={section.href}
              onFocus={() => onSectionFocus?.(section.key)}
              onMouseEnter={() => onSectionHover?.(section.key)}
              className={joinClasses(
                "flex w-full flex-col items-center justify-center gap-3 rounded-[20px] border ps-2 pe-2 py-3.5 text-center transition",
                active
                  ? "border-[rgba(91,140,232,0.2)] bg-[linear-gradient(180deg,rgba(72,96,141,0.34)_0%,rgba(51,66,96,0.4)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-transparent text-[#adb9d0] hover:bg-[rgba(255,255,255,0.035)] hover:text-[#f2f7ff]",
              )}
            >
              <span
                className={joinClasses(
                  "inline-flex h-[62px] w-[62px] items-center justify-center rounded-[18px] transition",
                  active
                    ? "bg-[linear-gradient(180deg,rgba(74,128,232,0.26)_0%,rgba(39,59,104,0.2)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "bg-[linear-gradient(180deg,rgba(255,255,255,0.055)_0%,rgba(255,255,255,0.02)_100%)] text-[#d7e0ef]",
                )}
              >
                <PortalRailIcon active={active} icon={section.icon} />
              </span>
              <span className="text-[11px] font-semibold leading-4 tracking-[0.04em]">{section.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
