import Link from "next/link";

type MetricCardProps = {
  label: string;
  value: string | number;
  description: string;
  href?: string;
};

export function MetricCard({ label, value, description, href }: MetricCardProps) {
  const content = (
    <article className="glass-card p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link className="transition hover:translate-y-[-1px]" href={href}>
      {content}
    </Link>
  );
}
