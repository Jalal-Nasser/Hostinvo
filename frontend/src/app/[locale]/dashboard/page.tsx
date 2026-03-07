import { getTranslations, setRequestLocale } from "next-intl/server";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { getAuthenticatedUserFromCookies, localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  noStore();
  setRequestLocale(params.locale);

  const user = await getAuthenticatedUserFromCookies(cookies().toString());

  if (!user) {
    redirect(localePath(params.locale, "/auth/login"));
  }

  const t = await getTranslations("Auth");

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-12">
      <div className="mx-auto grid max-w-5xl gap-6">
        <section className="glass-card p-6 md:p-8">
          <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.3em] text-accent">
            Hostinvo
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-foreground">
            {t("dashboardTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
            {t("dashboardDescription")}
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.35fr]">
          <article className="glass-card p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  {t("tenantLabel")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">
                  {user.tenant?.name ?? t("notAvailable")}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {user.tenant?.slug ?? user.tenant_id ?? t("notAvailable")}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  {t("localeLabel")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">
                  {user.locale}
                </h2>
                <p className="mt-2 text-sm text-muted">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-line bg-[#fffdf8] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  {t("rolesLabel")}
                </p>
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
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  {t("permissionsLabel")}
                </p>
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
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              {user.name}
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">{user.email}</p>

            <div className="mt-6">
              <LogoutButton />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
