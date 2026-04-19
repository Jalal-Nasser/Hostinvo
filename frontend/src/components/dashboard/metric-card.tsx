import Link from "next/link";

type MetricCardProps = {
  label: string;
  value: string | number;
  description: string;
  href?: string;
};

export function MetricCard({ label, value, description, href }: MetricCardProps) {
  const content = (
    <article className="stat-tile">
      <p className="stat-tile-label">{label}</p>
      <p className="stat-tile-value">{value}</p>
      <p className="stat-tile-meta">{description}</p>
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      className="block transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_20px_rgba(16,24,40,0.06)]"
      href={href}
    >
      {content}
    </Link>
  );
}
