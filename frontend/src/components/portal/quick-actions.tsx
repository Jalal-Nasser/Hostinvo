import Link from "next/link";

import { PortalActionIcon } from "@/components/portal/portal-icons";
import { portalTheme } from "@/components/portal/portal-theme";

type QuickAction = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: "buy-domain" | "transfer-domain" | "domain-pricing" | "get-support";
};

type QuickActionsProps = {
  kicker: string;
  title: string;
  actions: QuickAction[];
};

export function QuickActions({ kicker, title, actions }: QuickActionsProps) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={portalTheme.sectionKickerClass}>{kicker}</p>
          <h2 className="mt-1.5 text-[1.35rem] font-semibold tracking-[-0.02em] text-white md:text-[1.5rem]">
            {title}
          </h2>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className={[
              portalTheme.subtleSurfaceClass,
              "group relative flex min-h-[136px] flex-col items-start justify-between gap-4 overflow-hidden px-5 py-5 text-start transition-all",
              "hover:-translate-y-0.5 hover:border-[rgba(74,149,255,0.28)] hover:bg-[linear-gradient(180deg,rgba(44,60,92,0.82)_0%,rgba(32,44,74,0.88)_100%)] hover:shadow-[0_16px_32px_rgba(3,7,18,0.32)]",
            ].join(" ")}
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(74,149,255,0.22)_0%,rgba(30,64,175,0.12)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition group-hover:bg-[linear-gradient(135deg,rgba(74,149,255,0.32)_0%,rgba(30,64,175,0.18)_100%)]">
              <PortalActionIcon icon={action.icon} />
            </span>
            <div>
              <span className="text-[14.5px] font-semibold text-white">{action.label}</span>
              <p className="mt-1.5 text-[12.5px] leading-5 text-[#a5b4cf]">{action.description}</p>
            </div>
            <span className="absolute end-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)] text-[#8ea4ca] opacity-0 transition group-hover:opacity-100">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
