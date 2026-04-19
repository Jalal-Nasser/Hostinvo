import Link from "next/link";

type ModuleStatusCardProps = {
  title: string;
  description: string;
  total: number | null;
  accessible: boolean;
  availableLabel: string;
  restrictedLabel: string;
  href?: string;
};

export function ModuleStatusCard({
  title,
  description,
  total,
  accessible,
  availableLabel,
  restrictedLabel,
  href,
}: ModuleStatusCardProps) {
  const content = (
    <article className="group h-full rounded-xl border border-[#e5e7eb] bg-white p-4 transition-all hover:border-[#cbd5e1] hover:shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_20px_rgba(16,24,40,0.06)] md:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-[#0a1628]">{title}</p>
        <span
          className={[
            "status-pill",
            accessible ? "status-pill-info" : "status-pill-neutral",
          ].join(" ")}
        >
          <span className="status-pill-dot" />
          {accessible ? availableLabel : restrictedLabel}
        </span>
      </div>

      <p className="mt-4 text-[2rem] font-semibold leading-none tracking-[-0.04em] text-[#0a1628]">
        {accessible ? total ?? 0 : "--"}
      </p>
      <p className="mt-3 text-[13px] leading-6 text-[#475467]">{description}</p>

      {href && accessible ? (
        <div className="mt-4 flex items-center gap-1 text-[12.5px] font-semibold text-[#036deb] transition-colors group-hover:text-[#0255b6]">
          <span>View</span>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      ) : null}
    </article>
  );

  if (!href || !accessible) {
    return content;
  }

  return (
    <Link className="block" href={href}>
      {content}
    </Link>
  );
}
