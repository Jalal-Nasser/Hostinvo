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
    <article className="glass-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {accessible ? availableLabel : restrictedLabel}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-foreground">
        {accessible ? total ?? 0 : "--"}
      </p>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
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
