import { getTranslations, setRequestLocale } from "next-intl/server";

import { ClientForm } from "@/components/clients/client-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";

export default async function NewClientPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Clients");

  return (
    <DashboardShell
      currentPath="/dashboard/clients/new"
      description={t("createDescription")}
      locale={params.locale as AppLocale}
      title={t("createTitle")}
    >
      <ClientForm mode="create" />
    </DashboardShell>
  );
}
