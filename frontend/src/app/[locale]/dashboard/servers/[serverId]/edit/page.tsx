import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ServerForm } from "@/components/provisioning/server-form";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchServerFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function EditServerPage({
  params,
}: Readonly<{
  params: { locale: string; serverId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Provisioning");
  const server = await fetchServerFromCookies(cookies().toString(), params.serverId);

  if (!server) {
    notFound();
  }

  return (
    <DashboardShell
      actions={
        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, `/dashboard/servers/${server.id}`)}
        >
          {t("viewServerButton")}
        </Link>
      }
      currentPath={`/dashboard/servers/${server.id}/edit`}
      description={t("editServerDescription")}
      locale={params.locale as AppLocale}
      title={t("editServerTitle")}
    >
      <ServerForm initialServer={server} mode="edit" />
    </DashboardShell>
  );
}
