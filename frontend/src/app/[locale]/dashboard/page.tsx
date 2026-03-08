import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { getAuthenticatedUserFromCookies, localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const user = await getAuthenticatedUserFromCookies(cookies().toString());

  if (!user) {
    redirect(localePath(params.locale, "/auth/login"));
  }

  const t = await getTranslations("Dashboard");

  return (
    <DashboardShell
      currentPath="/dashboard"
      description={t("overviewDescription")}
      locale={params.locale as AppLocale}
      title={t("overviewTitle")}
    >
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("tenantLabel")}</p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">
                {user.tenant?.name ?? t("notAvailable")}
              </h2>
              <p className="mt-2 text-sm text-muted">{user.tenant?.slug ?? user.tenant_id ?? t("notAvailable")}</p>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("localeLabel")}</p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">{user.locale}</h2>
              <p className="mt-2 text-sm text-muted">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("rolesLabel")}</p>
              <ul className="mt-4 grid gap-2">
                {user.roles.map((role) => (
                  <li
                    key={role.id}
                    className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-medium text-foreground"
                  >
                    {role.display_name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("permissionsLabel")}</p>
              <ul className="mt-4 grid gap-2">
                {user.permissions.map((permission) => (
                  <li
                    key={permission.id}
                    className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-medium text-foreground"
                  >
                    {permission.display_name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <aside className="glass-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{user.name}</p>
          <p className="mt-2 text-sm leading-7 text-muted">{user.email}</p>

          <div className="mt-6 rounded-[1.5rem] border border-line bg-white/80 p-5">
            <h2 className="text-xl font-semibold text-foreground">{t("clientModuleTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{t("clientModuleDescription")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                href={localePath(params.locale, "/dashboard/clients")}
              >
                {t("clientsLink")}
              </Link>
              <Link
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                href={localePath(params.locale, "/dashboard/clients/new")}
              >
                {t("newClientLink")}
              </Link>
            </div>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
            <h2 className="text-xl font-semibold text-foreground">{t("catalogModuleTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{t("catalogModuleDescription")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                href={localePath(params.locale, "/dashboard/products")}
              >
                {t("productsLink")}
              </Link>
              <Link
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                href={localePath(params.locale, "/dashboard/product-groups")}
              >
                {t("productGroupsLink")}
              </Link>
            </div>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-line bg-white/80 p-5">
            <h2 className="text-xl font-semibold text-foreground">{t("ordersModuleTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{t("ordersModuleDescription")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                href={localePath(params.locale, "/dashboard/orders")}
              >
                {t("ordersLink")}
              </Link>
              <Link
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                href={localePath(params.locale, "/dashboard/orders/new")}
              >
                {t("newOrderLink")}
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
