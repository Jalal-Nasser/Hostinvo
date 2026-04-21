import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ServerForm } from "@/components/provisioning/server-form";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewServerPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Provisioning");

  return (
    <DashboardShell
      actions={
        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, "/dashboard/servers")}
        >
          {t("backToServersButton")}
        </Link>
      }
      currentPath="/dashboard/servers/new"
      description={t("createServerDescription")}
      locale={params.locale as AppLocale}
      title={t("createServerTitle")}
    >
      <ServerForm mode="create" />
    </DashboardShell>
  );
}
