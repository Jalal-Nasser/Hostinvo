import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  stats?: ReactNode;
  compact?: boolean;
};

type SectionHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

type FilterBarProps = {
  id?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

function joinClasses(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  stats,
  compact = true,
}: PageHeaderProps) {
  return (
    <section className="dashboard-header-surface">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          {eyebrow ? <div className="dashboard-header-eyebrow">{eyebrow}</div> : null}
          <h1
            className={joinClasses(
              eyebrow ? "mt-2" : "",
              compact ? "dashboard-page-title-compact" : "dashboard-page-title",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="dashboard-page-description">{description}</p>
          ) : null}
          {stats ? <div className="dashboard-header-stats">{stats}</div> : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="dashboard-section-header">
      <div className="min-w-0">
        {eyebrow ? <p className="dashboard-section-eyebrow">{eyebrow}</p> : null}
        <h2 className="dashboard-section-title">{title}</h2>
        {description ? (
          <p className="dashboard-section-description">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function FilterBar({ id, children, actions, className }: FilterBarProps) {
  return (
    <form
      id={id}
      className={joinClasses("dashboard-filter-bar", className)}
    >
      <div className="dashboard-filter-fields">{children}</div>
      {actions ? <div className="dashboard-filter-actions">{actions}</div> : null}
    </form>
  );
}
