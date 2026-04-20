import Image from "next/image";
import Link from "next/link";

import type { PortalSection, PortalSectionKey } from "@/components/portal/portal-navigation";
import { PortalBrandMark, PortalRailIcon } from "@/components/portal/portal-icons";
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
                "flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[4px] px-3 py-3 text-center transition",
                active
                  ? "bg-[linear-gradient(180deg,rgba(73,137,255,0.22)_0%,rgba(73,137,255,0.1)_100%)] text-white"
                  : "text-[#d8e3fb] hover:bg-[rgba(255,255,255,0.06)] hover:text-white",
              )}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] bg-[rgba(255,255,255,0.05)]">
                <PortalRailIcon active={active} icon={section.icon} />
              </span>
              <span className="text-[12px] font-medium leading-4">{section.label}</span>
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
        className="inline-flex items-center justify-center"
        aria-label={logoAlt}
      >
        {logoSrc ? (
          logoSrc.startsWith("/") ? (
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={40}
              height={40}
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
          <PortalBrandMark className="h-10 w-10" />
        )}
      </Link>

      <nav className="mt-7 flex w-full flex-1 flex-col items-center gap-4 px-2">
        {sections.map((section) => {
          const active = section.key === activeSectionKey;

          return (
            <Link
              key={section.key}
              href={section.href}
              onFocus={() => onSectionFocus?.(section.key)}
              onMouseEnter={() => onSectionHover?.(section.key)}
              className={joinClasses(
                "group flex w-full flex-col items-center justify-center gap-2 px-1 py-2.5 text-center transition",
                active ? "text-white" : "text-[#eef4ff] hover:text-white",
              )}
            >
              <span
                className={joinClasses(
                  "inline-flex h-[52px] w-[52px] items-center justify-center rounded-[4px] transition",
                  active
                    ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.03)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "bg-transparent group-hover:bg-[rgba(255,255,255,0.05)]",
                )}
              >
                <PortalRailIcon active={active} icon={section.icon} />
              </span>
              <span className="text-[12px] font-medium leading-5 tracking-[-0.01em]">{section.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
