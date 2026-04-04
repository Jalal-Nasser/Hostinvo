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
          <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.02em] text-white">{title}</h2>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className={[
              portalTheme.subtleSurfaceClass,
              "group flex min-h-[148px] flex-col items-start justify-between gap-5 ps-5 pe-5 py-5 text-start transition hover:-translate-y-0.5 hover:border-[rgba(113,137,177,0.18)] hover:bg-[linear-gradient(180deg,rgba(68,81,106,0.76)_0%,rgba(51,61,81,0.8)_100%)] hover:shadow-[0_16px_32px_rgba(7,12,24,0.24)]",
            ].join(" ")}
          >
            <span className="inline-flex h-[54px] w-[54px] items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <PortalActionIcon icon={action.icon} />
            </span>
            <div>
              <span className="text-[15px] font-semibold text-[#f2f6ff]">{action.label}</span>
              <p className="mt-2 text-sm leading-6 text-[#9fb0cf]">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
