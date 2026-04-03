import Link from "next/link";

type MetricCardProps = {
  label: string;
  value: string | number;
  description: string;
  href?: string;
};

export function MetricCard({ label, value, description, href }: MetricCardProps) {
  const content = (
    <article className="glass-card p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b8794]">
        {label}
      </p>
      <p className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[#0a1628]">{value}</p>
      <p className="mt-3 text-sm leading-7 text-[#6b7280]">{description}</p>
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
