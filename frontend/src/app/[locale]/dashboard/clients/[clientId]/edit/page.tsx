import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ClientForm } from "@/components/clients/client-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { fetchClientFromCookies } from "@/lib/clients";

export default async function EditClientPage({
  params,
}: Readonly<{
  params: { locale: string; clientId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Clients");
  const client = await fetchClientFromCookies(cookies().toString(), params.clientId);

  if (!client) {
    notFound();
  }

  return (
    <DashboardShell
      currentPath={`/dashboard/clients/${client.id}/edit`}
      description={t("editDescription", { name: client.display_name })}
      locale={params.locale as AppLocale}
      title={t("editTitle")}
    >
      <ClientForm initialClient={client} mode="edit" />
    </DashboardShell>
  );
}
