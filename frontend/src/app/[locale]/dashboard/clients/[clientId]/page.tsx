import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchClientFromCookies } from "@/lib/clients";

export const dynamic = "force-dynamic";

export default async function ClientDetailsPage({
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
      actions={
        <Link
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          href={localePath(params.locale, `/dashboard/clients/${client.id}/edit`)}
        >
          {t("editClientButton")}
        </Link>
      }
      currentPath={`/dashboard/clients/${client.id}`}
      description={t("detailsDescription")}
      locale={params.locale as AppLocale}
      title={client.display_name}
    >
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("emailLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{client.email}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("phoneLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{client.phone ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statusLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t(
                  client.status === "active"
                    ? "statusActive"
                    : client.status === "inactive"
                      ? "statusInactive"
                      : "statusLead",
                )}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("typeLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t(client.client_type === "company" ? "typeCompany" : "typeIndividual")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("countryLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{client.country}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("currencyLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{client.currency}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("localeLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{client.preferred_locale}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("ownerLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{client.owner?.name ?? t("notAvailable")}</p>
            </div>
          </div>

          {client.notes ? (
            <div className="mt-6 rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("notesLabel")}</p>
              <p className="mt-3 text-sm leading-7 text-foreground">{client.notes}</p>
            </div>
          ) : null}
        </article>

        <aside className="glass-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("createdAtLabel")}</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {new Intl.DateTimeFormat(params.locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(client.created_at))}
          </p>

          <div className="mt-6 grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("contactsCountLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{client.contacts_count ?? client.contacts?.length ?? 0}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("addressesCountLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {client.addresses_count ?? client.addresses?.length ?? 0}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("contactsSection")}</h2>
          {client.contacts && client.contacts.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {client.contacts.map((contact) => (
                <div key={contact.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {contact.first_name} {contact.last_name}
                    </p>
                    {contact.is_primary ? (
                      <span className="rounded-full border border-line bg-accentSoft px-3 py-1 text-xs font-semibold text-foreground">
                        {t("primaryLabel")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-muted">{contact.email}</p>
                  <p className="mt-2 text-sm text-muted">{contact.phone ?? t("notAvailable")}</p>
                  <p className="mt-2 text-sm text-muted">{contact.job_title ?? t("notAvailable")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("noContacts")}</p>
          )}
        </article>

        <article className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("addressesSection")}</h2>
          {client.addresses && client.addresses.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {client.addresses.map((address) => (
                <div key={address.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {t(
                        address.type === "billing"
                          ? "addressTypeBilling"
                          : address.type === "mailing"
                            ? "addressTypeMailing"
                            : "addressTypeService",
                      )}
                    </p>
                    {address.is_primary ? (
                      <span className="rounded-full border border-line bg-accentSoft px-3 py-1 text-xs font-semibold text-foreground">
                        {t("primaryLabel")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-muted">{address.line_1}</p>
                  {address.line_2 ? <p className="mt-2 text-sm text-muted">{address.line_2}</p> : null}
                  <p className="mt-2 text-sm text-muted">
                    {address.city}
                    {address.state ? `, ${address.state}` : ""} {address.postal_code ?? ""}
                  </p>
                  <p className="mt-2 text-sm text-muted">{address.country}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("noAddresses")}</p>
          )}
        </article>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("activitySection")}</h2>
        {client.activity_logs && client.activity_logs.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {client.activity_logs.map((activity) => (
              <div key={activity.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-foreground">{activity.description}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{activity.action}</p>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {activity.user?.name ?? t("systemActor")} ·{" "}
                  {new Intl.DateTimeFormat(params.locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(activity.created_at))}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">{t("noActivity")}</p>
        )}
      </section>
    </DashboardShell>
  );
}
