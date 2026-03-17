import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { MetricCard } from "@/components/dashboard/metric-card";
import { ModuleStatusCard } from "@/components/dashboard/module-status-card";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { type AppLocale } from "@/i18n/routing";
import {
  canAccessClientPortal,
  defaultWorkspacePath,
  getAuthenticatedUserFromCookies,
  localePath,
} from "@/lib/auth";
import { fetchPortalDashboardSummary } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);

  if (!user) {
    redirect(localePath(params.locale, "/auth/login"));
  }

  if (!canAccessClientPortal(user)) {
    redirect(defaultWorkspacePath(params.locale, user));
  }

  const t = await getTranslations("Portal");
  const workspaceT = await getTranslations("Workspace");
  const summary = await fetchPortalDashboardSummary(cookieHeader, user);

  return (
    <PortalShell
      actions={
        summary.modules.tickets.accessible ? (
          <Link
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            href={localePath(params.locale, "/portal/tickets")}
          >
            {t("openTicketsButton")}
          </Link>
        ) : undefined
      }
      currentPath="/portal"
      description={t("overviewDescription")}
      locale={params.locale as AppLocale}
      title={t("overviewTitle")}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleStatusCard
          accessible={summary.modules.services.accessible}
          availableLabel={workspaceT("availableLabel")}
          description={t("servicesCardDescription")}
          href={localePath(params.locale, "/dashboard/services")}
          restrictedLabel={workspaceT("restrictedLabel")}
          title={t("servicesLink")}
          total={summary.modules.services.total}
        />
        <ModuleStatusCard
          accessible={summary.modules.invoices.accessible}
          availableLabel={workspaceT("availableLabel")}
          description={t("invoicesCardDescription")}
          href={localePath(params.locale, "/dashboard/invoices")}
          restrictedLabel={workspaceT("restrictedLabel")}
          title={t("invoicesLink")}
          total={summary.modules.invoices.total}
        />
        <ModuleStatusCard
          accessible={summary.modules.tickets.accessible}
          availableLabel={workspaceT("availableLabel")}
          description={t("ticketsCardDescription")}
          href={localePath(params.locale, "/portal/tickets")}
          restrictedLabel={workspaceT("restrictedLabel")}
          title={t("ticketsLink")}
          total={summary.modules.tickets.total}
        />
        <ModuleStatusCard
          accessible={summary.modules.provisioning.accessible}
          availableLabel={workspaceT("availableLabel")}
          description={t("provisioningCardDescription")}
          href={localePath(params.locale, "/dashboard/provisioning")}
          restrictedLabel={workspaceT("restrictedLabel")}
          title={t("provisioningLink")}
          total={summary.modules.provisioning.total}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("selfServiceTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("selfServiceDescription")}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <MetricCard
              description={t("openTicketsDescription")}
              label={t("openTicketsLabel")}
              value={summary.ticket_health.open ?? "--"}
            />
            <MetricCard
              description={t("urgentTicketsDescription")}
              label={t("urgentTicketsLabel")}
              value={summary.ticket_health.urgent ?? "--"}
            />
          </div>
        </article>

        <aside className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("accountSummaryTitle")}</h2>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("tenantLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {user.tenant?.name ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("emailLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{user.email}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("localeLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{user.locale}</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-foreground">{t("recentTicketsTitle")}</h2>
          {summary.modules.tickets.accessible ? (
            <Link
              className="text-sm font-semibold text-accent transition hover:opacity-80"
              href={localePath(params.locale, "/portal/tickets")}
            >
              {t("viewAllLink")}
            </Link>
          ) : null}
        </div>
        {summary.recent_tickets.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {summary.recent_tickets.slice(0, 4).map((ticket) => (
              <Link
                key={ticket.id}
                className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5 transition hover:bg-[#fffdf8]"
                href={localePath(params.locale, `/portal/tickets/${ticket.id}`)}
              >
                <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
                <p className="mt-2 text-sm text-muted">
                  {ticket.ticket_number} / {ticket.status?.name ?? t("notAvailable")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm leading-7 text-muted">{t("recentTicketsEmpty")}</p>
        )}
      </section>
    </PortalShell>
  );
}
