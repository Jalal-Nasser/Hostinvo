import type { CSSProperties } from "react";

import type { PortalSectionKey } from "@/components/portal/portal-navigation";

export const portalThemeVariables = {
  "--background": "#0b1220",
  "--foreground": "#f4f7ff",
  "--card": "rgba(22, 30, 48, 0.92)",
  "--line": "rgba(148, 163, 184, 0.14)",
  "--accent": "#3b82f6",
  "--accent-soft": "rgba(59, 130, 246, 0.14)",
  "--muted": "#94a3b8",
  "--brand-blue": "#3b82f6",
  "--brand-blue-dark": "#1d4ed8",
  "--brand-navy": "#0b1a3a",
  "--brand-accent": "#60a5fa",
} as CSSProperties;

export const portalTheme = {
  pageBackgroundClass:
    "bg-[radial-gradient(140%_100%_at_50%_-10%,rgba(59,130,246,0.18)_0%,rgba(14,22,44,0.98)_42%,rgba(8,14,28,1)_100%)]",
  railClass:
    "flex h-screen w-[92px] flex-col items-center border-e border-[rgba(148,163,184,0.1)] bg-[linear-gradient(180deg,rgba(20,28,46,0.98)_0%,rgba(14,21,38,0.99)_100%)] py-5 shadow-[16px_0_40px_rgba(3,7,18,0.36)]",
  flyoutClass:
    "h-screen w-[236px] border-e border-[rgba(148,163,184,0.08)] bg-[linear-gradient(180deg,rgba(22,30,50,0.96)_0%,rgba(14,21,38,0.98)_100%)] backdrop-blur-[24px] shadow-[20px_0_36px_rgba(3,7,18,0.2)]",
  utilityStripClass:
    "rounded-xl border border-[rgba(148,163,184,0.12)] bg-[linear-gradient(90deg,rgba(28,38,60,0.94)_0%,rgba(20,28,46,0.96)_40%,rgba(14,21,38,0.98)_100%)] shadow-[0_8px_20px_rgba(3,7,18,0.24)] backdrop-blur-xl",
  heroClass:
    "rounded-2xl border border-[rgba(125,169,255,0.24)] bg-[linear-gradient(135deg,#1d8bff_0%,#1d4ed8_58%,#0e2d8f_100%)] shadow-[0_24px_48px_rgba(3,7,18,0.4)]",
  surfaceClass:
    "rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[linear-gradient(180deg,rgba(23,31,50,0.94)_0%,rgba(17,24,41,0.96)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(3,7,18,0.32)] backdrop-blur-xl",
  subtleSurfaceClass:
    "rounded-xl border border-[rgba(148,163,184,0.1)] bg-[linear-gradient(180deg,rgba(28,36,58,0.72)_0%,rgba(22,30,50,0.8)_100%)] shadow-[0_10px_22px_rgba(3,7,18,0.2)]",
  utilityLinkClass:
    "text-[11px] font-medium tracking-[0.14em] text-[#cdd7ed] transition hover:text-white",
  footerLinkClass:
    "text-[13px] leading-7 text-[#a5b4cf] transition hover:text-white",
  primaryButtonClass:
    "inline-flex min-h-11 items-center justify-center rounded-lg bg-[linear-gradient(180deg,#4a95ff_0%,#2f7aee_100%)] px-5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_12px_28px_rgba(47,122,238,0.34)] transition hover:-translate-y-0.5 hover:brightness-105",
  secondaryButtonClass:
    "inline-flex min-h-11 items-center justify-center rounded-lg border border-[rgba(148,163,184,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] px-5 text-sm font-semibold text-white/95 transition hover:border-[rgba(148,163,184,0.34)] hover:bg-[rgba(255,255,255,0.09)]",
  inputShellClass:
    "flex min-h-[52px] items-center rounded-lg border border-[#d7e5ff] bg-white shadow-[0_14px_28px_rgba(3,7,18,0.28)]",
  panelClass:
    "rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[linear-gradient(180deg,rgba(23,31,50,0.95)_0%,rgba(17,24,41,0.97)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(3,7,18,0.28)]",
  fieldClass:
    "min-h-12 w-full rounded-lg border border-[rgba(148,163,184,0.18)] bg-[rgba(10,17,32,0.8)] px-3.5 text-sm text-white outline-none transition placeholder:text-[#8393b5] focus:border-[#4a95ff] focus:ring-4 focus:ring-[rgba(74,149,255,0.18)]",
  chipClass:
    "inline-flex min-h-10 items-center justify-center rounded-lg border border-[rgba(148,163,184,0.14)] bg-[rgba(255,255,255,0.03)] px-3.5 text-sm font-medium text-[#d9e5fb] transition hover:border-[rgba(148,163,184,0.24)] hover:bg-[rgba(255,255,255,0.06)]",
  chipActiveClass:
    "border-[rgba(103,161,255,0.4)] bg-[linear-gradient(180deg,rgba(60,122,255,0.22)_0%,rgba(60,122,255,0.1)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
  noteClass:
    "rounded-xl border border-[rgba(148,163,184,0.12)] bg-[linear-gradient(180deg,rgba(28,36,58,0.82)_0%,rgba(22,30,50,0.88)_100%)] px-4 py-3 text-sm leading-7 text-[#b9c7df]",
  tableShellClass:
    "overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[linear-gradient(180deg,rgba(23,31,50,0.96)_0%,rgba(17,24,41,0.98)_100%)] shadow-[0_16px_32px_rgba(3,7,18,0.28)]",
  sectionKickerClass:
    "text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8ea4ca]",
} as const;

const portalHeaderCardBaseClass =
  "rounded-2xl border shadow-[0_22px_44px_rgba(3,7,18,0.32)] backdrop-blur-xl";

const portalHeaderCardVariants: Record<PortalSectionKey, string> = {
  products:
    "border-[rgba(148,163,184,0.18)] bg-[radial-gradient(circle_at_top_left,rgba(94,116,156,0.24)_0%,transparent_34%),linear-gradient(135deg,rgba(30,40,62,0.96)_0%,rgba(22,30,50,0.98)_60%,rgba(16,23,42,0.99)_100%)]",
  domains:
    "border-[rgba(103,146,232,0.22)] bg-[radial-gradient(circle_at_top_left,rgba(73,137,255,0.3)_0%,transparent_34%),linear-gradient(135deg,rgba(36,60,110,0.94)_0%,rgba(24,40,80,0.96)_48%,rgba(16,23,42,0.99)_100%)]",
  "website-security":
    "border-[rgba(88,145,188,0.22)] bg-[radial-gradient(circle_at_top_left,rgba(69,145,201,0.28)_0%,transparent_34%),linear-gradient(135deg,rgba(32,56,82,0.96)_0%,rgba(22,38,60,0.98)_56%,rgba(15,24,42,0.99)_100%)]",
  support:
    "border-[rgba(110,126,188,0.22)] bg-[radial-gradient(circle_at_top_left,rgba(96,119,212,0.28)_0%,transparent_34%),linear-gradient(135deg,rgba(38,50,88,0.96)_0%,rgba(26,36,64,0.98)_54%,rgba(16,23,42,0.99)_100%)]",
};

export function resolvePortalHeaderCardClass(sectionKey: PortalSectionKey): string {
  return [portalHeaderCardBaseClass, portalHeaderCardVariants[sectionKey]].join(" ");
}
