import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchClientsFromCookies } from "@/lib/clients";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams?: { search?: string; status?: string; page?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Clients");
  const response = await fetchClientsFromCookies(cookies().toString(), {
    search: searchParams?.search,
    status: searchParams?.status,
    page: searchParams?.page,
  });

  const clients = response?.data ?? [];

  return (
    <DashboardShell
      actions={
        <Link
          href={localePath(params.locale, "/dashboard/clients/new")}
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {t("newClientButton")}
        </Link>
      }
      currentPath="/dashboard/clients"
      description={t("listDescription")}
      locale={params.locale as AppLocale}
      title={t("listTitle")}
    >
      <section className="glass-card p-6 md:p-8">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("searchLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.search ?? ""}
              name="search"
              placeholder={t("searchPlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-white/85 px-4 py-3 outline-none transition focus:border-accent"
              defaultValue={searchParams?.status ?? ""}
              name="status"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="active">{t("statusActive")}</option>
              <option value="inactive">{t("statusInactive")}</option>
              <option value="lead">{t("statusLead")}</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              type="submit"
            >
              {t("searchButton")}
            </button>

            <Link
              className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
              href={localePath(params.locale, "/dashboard/clients")}
            >
              {t("clearFilters")}
            </Link>
          </div>
        </form>
      </section>

      {clients.length === 0 ? (
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-foreground">{t("emptyStateTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{t("emptyStateDescription")}</p>
        </section>
      ) : (
        <section className="grid gap-4">
          {clients.map((client) => (
            <article key={client.id} className="glass-card p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">{client.display_name}</h2>
                    <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {t(
                        client.status === "active"
                          ? "statusActive"
                          : client.status === "inactive"
                            ? "statusInactive"
                            : "statusLead",
                      )}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">{client.email}</p>
                  <p className="mt-2 text-sm text-muted">{client.phone ?? t("notAvailable")}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/dashboard/clients/${client.id}`)}
                  >
                    {t("viewDetails")}
                  </Link>
                  <Link
                    className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                    href={localePath(params.locale, `/dashboard/clients/${client.id}/edit`)}
                  >
                    {t("editClientButton")}
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("countryLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{client.country}</p>
                </div>
                <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("localeLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{client.preferred_locale}</p>
                </div>
                <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("contactsCountLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{client.contacts_count ?? 0}</p>
                </div>
                <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("addressesCountLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{client.addresses_count ?? 0}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
