import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DomainForm } from "@/components/domains/domain-form";
import { type AppLocale } from "@/i18n/routing";
import { fetchClientsFromCookies } from "@/lib/clients";
import { fetchDomainFromCookies } from "@/lib/domains";
import { fetchServicesFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function EditDomainPage({
  params,
}: Readonly<{
  params: { locale: string; domainId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");
  const cookieHeader = cookies().toString();
  const [domain, clientsResponse, servicesResponse] = await Promise.all([
    fetchDomainFromCookies(cookieHeader, params.domainId, "admin"),
    fetchClientsFromCookies(cookieHeader, { per_page: "100", status: "active" }),
    fetchServicesFromCookies(cookieHeader, { per_page: "100" }),
  ]);

  if (!domain) {
    notFound();
  }

  return (
    <DashboardShell
      currentPath={`/dashboard/domains/${domain.id}/edit`}
      description={t("editDescription", { domain: domain.domain })}
      locale={params.locale as AppLocale}
      title={t("editTitle")}
    >
      <DomainForm
        clients={clientsResponse?.data ?? []}
        initialDomain={domain}
        mode="edit"
        services={servicesResponse?.data ?? []}
      />
    </DashboardShell>
  );
}
