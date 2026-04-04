import Link from "next/link";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { KnowledgebaseManager } from "@/components/tenant-admin/knowledgebase-manager";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchKnowledgeBaseFromCookies } from "@/lib/tenant-admin";

export const dynamic = "force-dynamic";

export default async function KnowledgebaseContentPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const copy = tenantAdminCopy(params.locale);
  const response = await fetchKnowledgeBaseFromCookies(cookies().toString(), "admin");
  const categories = response && !Array.isArray(response.categories) ? response.categories.data : [];
  const articles =
    response?.articles && !Array.isArray(response.articles) ? response.articles.data : [];

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
      currentPath="/dashboard/content/knowledgebase"
      description={copy.knowledgebase.pageDescription}
      locale={params.locale as AppLocale}
      title={copy.knowledgebase.pageTitle}
    >
      <KnowledgebaseManager locale={params.locale} categories={categories} articles={articles} />
    </DashboardShell>
  );
}
