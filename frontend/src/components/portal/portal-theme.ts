import type { CSSProperties } from "react";

import type { PortalSectionKey } from "@/components/portal/portal-navigation";

export const portalThemeVariables = {
  "--background": "#313b51",
  "--foreground": "#f5f7fe",
  "--card": "rgba(74, 88, 116, 0.14)",
  "--line": "rgba(255,255,255,0.08)",
  "--accent": "#3b82f6",
  "--accent-soft": "rgba(59, 130, 246, 0.14)",
  "--muted": "#aeb9d3",
  "--brand-blue": "#2b79ff",
  "--brand-blue-dark": "#1d4ed8",
  "--brand-navy": "#1e49bc",
  "--brand-accent": "#2aa7ff",
} as CSSProperties;

export const portalTheme = {
  pageBackgroundClass:
    "bg-[#121f33] bg-[radial-gradient(140%_120%_at_50%_0%,rgba(95,110,137,0.16)_0%,rgba(60,71,94,0.08)_24%,rgba(53,63,86,0.96)_48%,rgba(49,59,81,1)_100%)]",
  railClass:
    "flex h-screen w-[104px] flex-col items-center border-e border-[rgba(255,255,255,0.05)] bg-[linear-gradient(180deg,#59657d_0%,#48546c_100%)] py-5",
  flyoutClass:
    "h-screen w-[248px] border-e border-[rgba(255,255,255,0.04)] bg-[linear-gradient(180deg,rgba(67,78,101,0.94)_0%,rgba(56,66,88,0.92)_100%)] backdrop-blur-[18px]",
  utilityStripClass:
    "border-b border-[rgba(255,255,255,0.06)] bg-[linear-gradient(90deg,#515c74_0%,#465066_46%,#3e475e_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  heroClass:
    "relative overflow-hidden bg-[linear-gradient(180deg,#1f49bc_0%,#1f49bc_100%)]",
  surfaceClass:
    "rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(101,117,149,0.14)_0%,rgba(84,98,128,0.12)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
  subtleSurfaceClass:
    "rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(111,126,157,0.16)_0%,rgba(92,105,134,0.14)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
  utilityLinkClass:
    "text-[12px] font-semibold text-[#eef4ff] transition hover:text-white",
  footerLinkClass:
    "text-[14px] leading-8 text-[#dde7fa] transition hover:text-white",
  primaryButtonClass:
    "inline-flex min-h-11 items-center justify-center rounded-[4px] bg-[linear-gradient(180deg,#4387ff_0%,#3371ea_100%)] px-5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] transition hover:brightness-105",
  secondaryButtonClass:
    "inline-flex min-h-11 items-center justify-center rounded-[4px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(108,124,155,0.18)_0%,rgba(82,95,123,0.16)_100%)] px-5 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.08)]",
  inputShellClass:
    "flex min-h-[52px] items-center rounded-[4px] border border-[#d7e5ff] bg-white shadow-[0_8px_18px_rgba(9,20,58,0.2)]",
  panelClass:
    "rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(101,117,149,0.14)_0%,rgba(84,98,128,0.12)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
  fieldClass:
    "min-h-12 w-full rounded-[4px] border border-[rgba(255,255,255,0.12)] bg-[rgba(28,36,52,0.78)] px-3.5 text-sm text-white outline-none transition placeholder:text-[#a5b1ca] focus:border-[#5b96ff] focus:ring-4 focus:ring-[rgba(91,150,255,0.18)]",
  chipClass:
    "inline-flex min-h-10 items-center justify-center rounded-[4px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-3.5 text-sm font-medium text-[#e6edfb] transition hover:bg-[rgba(255,255,255,0.07)]",
  chipActiveClass:
    "border-[rgba(97,160,255,0.36)] bg-[linear-gradient(180deg,rgba(73,137,255,0.22)_0%,rgba(73,137,255,0.1)_100%)] text-white",
  noteClass:
    "rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(84,98,128,0.14)_0%,rgba(69,82,107,0.12)_100%)] px-4 py-3 text-sm leading-7 text-[#d1dbef]",
  tableShellClass:
    "overflow-hidden rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(101,117,149,0.14)_0%,rgba(84,98,128,0.12)_100%)]",
  sectionKickerClass:
    "text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9fb2d8]",
} as const;

const portalHeaderCardBaseClass =
  "rounded-[4px] border shadow-[0_16px_28px_rgba(18,24,38,0.18)]";

const portalHeaderCardVariants: Record<PortalSectionKey, string> = {
  products:
    "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(91,106,138,0.18)_0%,rgba(66,79,105,0.16)_100%)]",
  domains:
    "border-[rgba(104,157,255,0.2)] bg-[linear-gradient(180deg,rgba(57,122,243,0.24)_0%,rgba(67,80,108,0.18)_100%)]",
  "website-security":
    "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(91,106,138,0.18)_0%,rgba(66,79,105,0.16)_100%)]",
  support:
    "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(91,106,138,0.18)_0%,rgba(66,79,105,0.16)_100%)]",
};

export function resolvePortalHeaderCardClass(sectionKey: PortalSectionKey): string {
  return [portalHeaderCardBaseClass, portalHeaderCardVariants[sectionKey]].join(" ");
}
