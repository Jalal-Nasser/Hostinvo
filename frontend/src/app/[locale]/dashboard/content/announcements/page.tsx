import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AnnouncementManager } from "@/components/tenant-admin/announcement-manager";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchAnnouncementsFromCookies } from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function AnnouncementContentPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const copy = tenantAdminCopy(params.locale);
  const response = await fetchAnnouncementsFromCookies(cookies().toString(), {}, "admin");
  const announcements = response && !Array.isArray(response) ? response.data : [];

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/content")}
          className="btn-secondary whitespace-nowrap"
        >
          {copy.common.backToContent}
        </Link>
      }
      currentPath="/dashboard/content/announcements"
      description={copy.announcements.pageDescription}
      locale={params.locale as AppLocale}
      title={copy.announcements.pageTitle}
    >
      <AnnouncementManager locale={params.locale} initialAnnouncements={announcements} />
    </DashboardShell>
  );
}
