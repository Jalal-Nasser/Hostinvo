import { type AppLocale } from "@/i18n/routing";

import { PortalShell as BasePortalShell } from "@/components/portal/portal-shell";

type PortalShellProps = {
  locale: AppLocale;
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  showPageIntro?: boolean;
};

export async function PortalShell(props: PortalShellProps) {
  return <BasePortalShell {...props} />;
}
