import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TicketForm } from "@/components/support/ticket-form";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import {
  fetchTicketDepartmentsFromCookies,
  fetchTicketServicesFromCookies,
} from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function PortalNewTicketPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { service_id?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Support");
  const domainsT = await getTranslations("Domains");
  const cookieHeader = cookies().toString();
  const [departmentsResponse, services] = await Promise.all([
    fetchTicketDepartmentsFromCookies(cookieHeader, { per_page: "100", is_active: "true" }, "client"),
    fetchTicketServicesFromCookies(cookieHeader),
  ]);

  const departments = departmentsResponse?.data ?? [];

  return (
    <PortalShell
      actions={
        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, "/portal/tickets")}
        >
          {t("backToTicketsButton")}
        </Link>
      }
      currentPath="/portal/tickets/new"
      description={t("createDescription")}
      locale={params.locale as AppLocale}
      title={t("createTitle")}
    >
      <TicketForm
        mode="client"
        departments={departments}
        services={services ?? []}
        ticketsPath="/portal/tickets"
        serviceLabel={domainsT("serviceLabel")}
        noServiceOptionLabel={domainsT("noServiceOption")}
        initialServiceId={searchParams?.service_id}
      />
    </PortalShell>
  );
}

