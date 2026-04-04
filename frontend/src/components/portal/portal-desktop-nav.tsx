"use client";

import { useEffect, useState } from "react";

import { PortalFlyoutMenu } from "@/components/portal/portal-flyout-menu";
import {
  type PortalSection,
  type PortalSectionKey,
} from "@/components/portal/portal-navigation";
import { PortalRailNav } from "@/components/portal/portal-rail-nav";

type PortalDesktopNavProps = {
  locale: string;
  currentPath: string;
  sections: PortalSection[];
  activeSectionKey: PortalSectionKey;
  logoSrc?: string | null;
  logoAlt?: string;
};

export function PortalDesktopNav({
  locale,
  currentPath,
  sections,
  activeSectionKey,
  logoSrc,
  logoAlt,
}: PortalDesktopNavProps) {
  const [hoveredKey, setHoveredKey] = useState<PortalSectionKey | null>(null);

  useEffect(() => {
    setHoveredKey(null);
  }, [activeSectionKey]);

  const highlightedKey = hoveredKey ?? activeSectionKey;
  const highlightedSection =
    sections.find((section) => section.key === highlightedKey) ?? sections[0];
  const flyoutSection = highlightedSection.items.length > 0 ? highlightedSection : null;

  return (
    <div
      className="flex h-screen"
      onMouseLeave={() => setHoveredKey(null)}
    >
      <PortalRailNav
        activeSectionKey={highlightedKey}
        locale={locale}
        onSectionFocus={setHoveredKey}
        onSectionHover={setHoveredKey}
        sections={sections}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
      />
      {flyoutSection ? (
        <PortalFlyoutMenu
          currentPath={currentPath}
          locale={locale}
          section={flyoutSection}
        />
      ) : null}
    </div>
  );
}
