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
    <article className="dashboard-subtle-card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8794]">
            {accessible ? availableLabel : restrictedLabel}
          </p>
          <p className="mt-2 text-base font-semibold text-[#0a1628]">{title}</p>
        </div>
        <span className="rounded-lg border border-[#e5e7eb] bg-[#faf9f5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f7389]">
          {accessible ? availableLabel : restrictedLabel}
        </span>
      </div>

      <p className="mt-6 text-[2rem] font-bold tracking-[-0.05em] text-[#0a1628] md:text-[2.2rem]">
        {accessible ? total ?? 0 : "--"}
      </p>
      <p className="mt-3 text-sm leading-7 text-[#6b7280]">{description}</p>
    </article>
  );

  if (!href || !accessible) {
    return content;
  }

  return (
    <Link className="transition hover:translate-y-[-1px]" href={href}>
      {content}
    </Link>
  );
}
