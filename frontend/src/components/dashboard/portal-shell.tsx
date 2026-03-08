import { type AppLocale } from "@/i18n/routing";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";

type PortalShellProps = {
  locale: AppLocale;
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export async function PortalShell(props: PortalShellProps) {
  return <WorkspaceShell {...props} mode="portal" />;
}
