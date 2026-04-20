import Link from "next/link";

import { PortalActionIcon } from "@/components/portal/portal-icons";
import { portalTheme } from "@/components/portal/portal-theme";

type QuickAction = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: "buy-domain" | "order-hosting" | "make-payment" | "get-support";
};

type QuickActionsProps = {
  kicker: string;
  title: string;
  helperText: string;
  emptyTitle: string;
  emptyDescription: string;
  actions: QuickAction[];
};

export function QuickActions({
  kicker,
  title,
  helperText,
  emptyTitle,
  emptyDescription,
  actions,
}: QuickActionsProps) {
  return (
    <section className="mx-auto max-w-[960px] pt-11">
      <div className="text-center">
        <p className={portalTheme.sectionKickerClass}>{kicker}</p>
        <h2 className="text-[22px] font-normal tracking-[-0.02em] text-white md:text-[24px]">
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-[#cbd6eb]">
          {helperText}
        </p>
      </div>
      {actions.length > 0 ? (
        <div className="mt-8 grid justify-center gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className={[
                portalTheme.subtleSurfaceClass,
                "group relative flex min-h-[178px] w-full min-w-[190px] max-w-[210px] flex-col items-center justify-center gap-4 overflow-hidden px-5 py-5 text-center transition-all",
                "hover:bg-[linear-gradient(180deg,rgba(121,136,167,0.2)_0%,rgba(89,102,132,0.18)_100%)]",
              ].join(" ")}
            >
              <PortalActionIcon icon={action.icon} className="h-12 w-12" />
              <span className="text-[17px] font-normal text-white">{action.label}</span>
              <span className="text-[13px] leading-6 text-[#cbd6eb]">
                {action.description}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className={[portalTheme.noteClass, "mx-auto mt-8 max-w-2xl text-start"].join(" ")}>
          <p className="font-semibold text-white">{emptyTitle}</p>
          <p className="mt-1 text-[#cbd6eb]">{emptyDescription}</p>
        </div>
      )}
    </section>
  );
}
