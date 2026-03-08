import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TicketForm } from "@/components/support/ticket-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchClientsFromCookies } from "@/lib/clients";
import { fetchTicketDepartmentsFromCookies } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function NewTicketPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Support");
  const cookieHeader = cookies().toString();
  const [clientsResponse, departmentsResponse] = await Promise.all([
    fetchClientsFromCookies(cookieHeader, { per_page: "100", status: "active" }),
    fetchTicketDepartmentsFromCookies(cookieHeader, { per_page: "100", is_active: "true" }),
  ]);

  const clients = clientsResponse?.data ?? [];
  const departments = departmentsResponse?.data ?? [];

  return (
    <DashboardShell
      actions={
        <Link
          className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, "/dashboard/tickets")}
        >
          {t("backToTicketsButton")}
        </Link>
      }
      currentPath="/dashboard/tickets/new"
      description={t("createDescription")}
      locale={params.locale as AppLocale}
      title={t("createTitle")}
    >
      {clients.length === 0 ? (
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("clientsRequiredTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("clientsRequiredDescription")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              href={localePath(params.locale, "/dashboard/clients/new")}
            >
              {t("createClientButton")}
            </Link>
          </div>
        </section>
      ) : (
        <TicketForm clients={clients} departments={departments} />
      )}
    </DashboardShell>
  );
}
