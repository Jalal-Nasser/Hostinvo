import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchDomainFromCookies } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function DomainDetailsPage({
  params,
}: Readonly<{
  params: { locale: string; domainId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Domains");
  const domain = await fetchDomainFromCookies(cookies().toString(), params.domainId, "admin");

  if (!domain) {
    notFound();
  }

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95" href={localePath(params.locale, `/dashboard/domains/${domain.id}/edit`)}>
            {t("editDomainButton")}
          </Link>
          <Link className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft" href={localePath(params.locale, `/dashboard/domains/${domain.id}/contacts`)}>
            {t("contactsButton")}
          </Link>
          <Link className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft" href={localePath(params.locale, `/dashboard/domains/${domain.id}/renewals`)}>
            {t("renewalHistoryButton")}
          </Link>
        </div>
      }
      currentPath={`/dashboard/domains/${domain.id}`}
      description={t("detailsDescription")}
      locale={params.locale as AppLocale}
      title={domain.domain}
    >
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statusLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{t(`status${domain.status.replace(/(^|_)([a-z])/g, (_, __, char) => char.toUpperCase())}`)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("registrarLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.registrar ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("clientLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.client?.display_name ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("serviceLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.service?.reference_number ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("registrationDateLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.registration_date ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("expiryDateLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.expiry_date ?? t("notAvailable")}</p>
            </div>
          </div>

          {domain.notes ? (
            <div className="mt-6 rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("notesLabel")}</p>
              <p className="mt-3 text-sm leading-7 text-foreground">{domain.notes}</p>
            </div>
          ) : null}
        </article>

        <aside className="glass-card p-6 md:p-8">
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("autoRenewLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.auto_renew ? t("yesLabel") : t("noLabel")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("dnsManagementLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.dns_management ? t("yesLabel") : t("noLabel")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("idProtectionLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.id_protection ? t("yesLabel") : t("noLabel")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("renewalPriceLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{domain.renewal_price ?? t("notAvailable")} {domain.currency}</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{t("contactsSection")}</h2>
            <Link className="text-sm font-semibold text-accent transition hover:opacity-80" href={localePath(params.locale, `/dashboard/domains/${domain.id}/contacts`)}>
              {t("manageContactsButton")}
            </Link>
          </div>
          {domain.contacts && domain.contacts.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {domain.contacts.map((contact) => (
                <div key={contact.id} className="rounded-[1.5rem] border border-line bg-white/80 p-5">
                  <p className="text-sm font-semibold text-foreground">{t(`contactType${contact.type.charAt(0).toUpperCase()}${contact.type.slice(1)}`)}</p>
                  <p className="mt-2 text-sm text-muted">{contact.first_name} {contact.last_name}</p>
                  <p className="mt-2 text-sm text-muted">{contact.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("noContacts")}</p>
          )}
        </article>

        <article className="glass-card p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{t("renewalHistoryTitle")}</h2>
            <Link className="text-sm font-semibold text-accent transition hover:opacity-80" href={localePath(params.locale, `/dashboard/domains/${domain.id}/renewals`)}>
              {t("viewAllLink")}
            </Link>
          </div>
          {domain.renewals && domain.renewals.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {domain.renewals.slice(0, 4).map((renewal) => (
                <div key={renewal.id} className="rounded-[1.5rem] border border-line bg-white/80 p-5">
                  <p className="text-sm font-semibold text-foreground">{t("renewalYearsValue", { years: renewal.years })}</p>
                  <p className="mt-2 text-sm text-muted">{renewal.price} / {renewal.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("noRenewals")}</p>
          )}
        </article>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("registrarLogsTitle")}</h2>
        {domain.registrar_logs && domain.registrar_logs.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {domain.registrar_logs.map((log) => (
              <div key={log.id} className="rounded-[1.5rem] border border-line bg-white/80 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-foreground">{log.operation}</p>
                  <span className="rounded-full border border-line bg-accentSoft px-3 py-1 text-xs font-semibold text-foreground">{log.status}</span>
                </div>
                {log.error_message ? <p className="mt-3 text-sm text-red-700">{log.error_message}</p> : null}
                <p className="mt-3 text-sm text-muted">{log.created_at ?? t("notAvailable")}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">{t("noRegistrarLogs")}</p>
        )}
      </section>
    </DashboardShell>
  );
}
