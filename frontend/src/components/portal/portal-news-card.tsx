import { portalTheme } from "@/components/portal/portal-theme";

type PortalNewsCardProps = {
  kicker: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

export function PortalNewsCard({
  kicker,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: PortalNewsCardProps) {
  return (
    <section id="news">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className={portalTheme.sectionKickerClass}>{kicker}</p>
          <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.02em] text-white">{title}</h2>
        </div>
      </div>

      <article className={[portalTheme.surfaceClass, "ps-6 pe-6 py-6 md:ps-7 md:pe-7 md:py-7"].join(" ")}>
        <p className="max-w-2xl text-sm leading-7 text-[#aebad4]">{description}</p>
        <div className="mt-5 rounded-[12px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.015)_100%)] ps-5 pe-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <h3 className="text-[1.2rem] font-medium tracking-[-0.02em] text-white">
            {emptyTitle}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#aebad4]">{emptyDescription}</p>
        </div>
      </article>
    </section>
  );
}
