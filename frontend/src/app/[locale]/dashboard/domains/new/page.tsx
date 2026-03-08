import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DomainForm } from "@/components/domains/domain-form";
import { type AppLocale } from "@/i18n/routing";
import { fetchClientsFromCookies } from "@/lib/clients";
import { fetchServicesFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function NewDomainPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");
  const cookieHeader = cookies().toString();
  const [clientsResponse, servicesResponse] = await Promise.all([
    fetchClientsFromCookies(cookieHeader, { per_page: "100", status: "active" }),
    fetchServicesFromCookies(cookieHeader, { per_page: "100" }),
  ]);

  return (
    <DashboardShell
      currentPath="/dashboard/domains/new"
      description={t("createDescription")}
      locale={params.locale as AppLocale}
      title={t("createTitle")}
    >
      <DomainForm
        clients={clientsResponse?.data ?? []}
        mode="create"
        services={servicesResponse?.data ?? []}
      />
    </DashboardShell>
  );
}
