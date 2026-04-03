import { type AppLocale } from "@/i18n/routing";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";

type DashboardShellProps = {
  locale: AppLocale;
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  headerStats?: React.ReactNode;
  tintedHeader?: boolean;
};

export async function DashboardShell({
  locale,
  currentPath,
  title,
  description,
  children,
  actions,
  headerStats,
  tintedHeader = true,
}: DashboardShellProps) {
  return (
    <WorkspaceShell
      {...{
        locale,
        currentPath,
        title,
        description,
        children,
        actions,
        headerStats,
        tintedHeader,
      }}
      mode="admin"
    />
  );
}
