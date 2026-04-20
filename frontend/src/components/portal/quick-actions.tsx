import Link from "next/link";

import { PortalActionIcon } from "@/components/portal/portal-icons";
import { portalTheme } from "@/components/portal/portal-theme";

type QuickAction = {
  key: string;
  label: string;
  href: string;
  icon: "buy-domain" | "order-hosting" | "make-payment" | "get-support";
};

type QuickActionsProps = {
  kicker: string;
  title: string;
  actions: QuickAction[];
};

export function QuickActions({ title, actions }: QuickActionsProps) {
  return (
    <section className="mx-auto max-w-[960px] pt-11">
      <div className="text-center">
        <h2 className="text-[22px] font-normal tracking-[-0.02em] text-white md:text-[24px]">
          {title}
        </h2>
      </div>
      <div className="mt-8 grid justify-center gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className={[
              portalTheme.subtleSurfaceClass,
              "group relative flex min-h-[146px] w-full min-w-[170px] max-w-[176px] flex-col items-center justify-center gap-4 overflow-hidden px-5 py-5 text-center transition-all",
              "hover:bg-[linear-gradient(180deg,rgba(121,136,167,0.2)_0%,rgba(89,102,132,0.18)_100%)]",
            ].join(" ")}
          >
            <PortalActionIcon icon={action.icon} className="h-12 w-12" />
            <span className="text-[17px] font-normal text-white">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
