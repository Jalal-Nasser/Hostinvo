import type { CSSProperties } from "react";

export const portalThemeVariables = {
  "--background": "#1d2432",
  "--foreground": "#f4f7ff",
  "--card": "rgba(40, 49, 66, 0.9)",
  "--line": "rgba(104, 123, 158, 0.18)",
  "--accent": "#3486ff",
  "--accent-soft": "rgba(52, 134, 255, 0.14)",
  "--muted": "#9baac6",
  "--brand-blue": "#2f87ff",
  "--brand-blue-dark": "#1a65ff",
  "--brand-navy": "#1537a7",
  "--brand-accent": "#4094ff",
} as CSSProperties;

export const portalTheme = {
  pageBackgroundClass:
    "bg-[radial-gradient(circle_at_top,rgba(76,92,122,0.22)_0%,rgba(35,43,59,0.96)_34%,rgba(24,31,44,1)_100%)]",
  railClass:
    "flex h-screen w-[108px] flex-col items-center border-e border-[rgba(82,99,129,0.24)] bg-[linear-gradient(180deg,rgba(72,84,108,0.98)_0%,rgba(52,62,83,0.995)_100%)] py-6 shadow-[14px_0_40px_rgba(4,8,18,0.34)]",
  flyoutClass:
    "h-screen w-[248px] border-e border-[rgba(82,99,129,0.14)] bg-[linear-gradient(180deg,rgba(44,55,77,0.48)_0%,rgba(34,41,57,0.58)_100%)] backdrop-blur-[34px] shadow-[20px_0_34px_rgba(4,8,18,0.16)]",
  utilityStripClass:
    "rounded-[12px] border border-[rgba(104,123,158,0.14)] bg-[linear-gradient(180deg,rgba(49,58,77,0.8)_0%,rgba(38,45,61,0.82)_100%)] shadow-[0_10px_24px_rgba(4,8,18,0.2)] backdrop-blur-xl",
  heroClass:
    "rounded-[16px] border border-[rgba(125,169,255,0.24)] bg-[linear-gradient(135deg,#1d91ff_0%,#2164ec_48%,#173ebf_100%)] shadow-[0_24px_44px_rgba(6,14,34,0.34)]",
  surfaceClass:
    "rounded-[14px] border border-[rgba(104,123,158,0.12)] bg-[linear-gradient(180deg,rgba(42,50,68,0.94)_0%,rgba(34,41,56,0.96)_100%)] shadow-[0_18px_36px_rgba(5,10,22,0.3)] backdrop-blur-xl",
  subtleSurfaceClass:
    "rounded-[12px] border border-[rgba(104,123,158,0.1)] bg-[linear-gradient(180deg,rgba(53,63,84,0.62)_0%,rgba(42,50,68,0.7)_100%)] shadow-[0_12px_28px_rgba(5,10,22,0.18)]",
  utilityLinkClass:
    "text-[11px] font-medium tracking-[0.12em] text-[#ced9f0] transition hover:text-white",
  footerLinkClass:
    "text-[13px] leading-7 text-[#aab7d2] transition hover:text-white",
  primaryButtonClass:
    "inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[linear-gradient(180deg,#56a6ff_0%,#2e79ff_100%)] ps-5 pe-5 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(18,78,207,0.34)] transition hover:translate-y-[-1px] hover:brightness-105",
  secondaryButtonClass:
    "inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[rgba(151,178,220,0.2)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_100%)] ps-5 pe-5 text-sm font-semibold text-white/92 transition hover:border-[rgba(151,178,220,0.28)] hover:bg-[rgba(255,255,255,0.1)]",
  inputShellClass:
    "flex min-h-[52px] items-center rounded-[10px] border border-[#d7e5ff] bg-white shadow-[0_14px_28px_rgba(16,42,96,0.2)]",
  panelClass:
    "rounded-[14px] border border-[rgba(104,123,158,0.12)] bg-[linear-gradient(180deg,rgba(40,48,65,0.96)_0%,rgba(32,39,54,0.98)_100%)] shadow-[0_18px_36px_rgba(5,10,22,0.28)]",
  fieldClass:
    "min-h-12 w-full rounded-[12px] border border-[rgba(115,136,173,0.18)] bg-[linear-gradient(180deg,rgba(33,40,55,0.98)_0%,rgba(28,34,47,0.98)_100%)] ps-4 pe-4 text-sm text-white outline-none transition placeholder:text-[#7f94bb] focus:border-[#4d92ff] focus:ring-2 focus:ring-[rgba(52,134,255,0.2)]",
  chipClass:
    "inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[rgba(104,123,158,0.14)] bg-[rgba(255,255,255,0.03)] ps-4 pe-4 text-sm font-medium text-[#d9e5fb] transition hover:border-[rgba(104,123,158,0.22)] hover:bg-[rgba(255,255,255,0.06)]",
  chipActiveClass:
    "border-[rgba(103,161,255,0.38)] bg-[linear-gradient(180deg,rgba(60,122,255,0.2)_0%,rgba(60,122,255,0.1)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
  noteClass:
    "rounded-[12px] border border-[rgba(104,123,158,0.12)] bg-[linear-gradient(180deg,rgba(44,52,70,0.84)_0%,rgba(37,44,60,0.88)_100%)] ps-4 pe-4 py-3 text-sm leading-7 text-[#b9c7df]",
  tableShellClass:
    "overflow-hidden rounded-[14px] border border-[rgba(104,123,158,0.12)] bg-[linear-gradient(180deg,rgba(37,44,60,0.96)_0%,rgba(31,38,52,0.98)_100%)] shadow-[0_16px_32px_rgba(5,10,22,0.24)]",
  sectionKickerClass:
    "text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8ea4ca]",
} as const;
