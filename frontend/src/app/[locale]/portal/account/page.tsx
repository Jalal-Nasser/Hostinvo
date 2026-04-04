import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PortalShell } from "@/components/dashboard/portal-shell";
import { portalTheme } from "@/components/portal/portal-theme";
import { type AppLocale } from "@/i18n/routing";
import { getAuthenticatedUserFromCookies, localePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalAccountPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Portal");
  const user = await getAuthenticatedUserFromCookies(cookies().toString());

  return (
    <PortalShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/tickets")}>
            {t("viewTicketsButton")}
          </Link>
          <Link className={portalTheme.primaryButtonClass} href={localePath(params.locale, "/portal/domains")}>
            {t("accountManageDomainsButton")}
          </Link>
        </div>
      }
      currentPath="/portal/account"
      description={t("accountPageDescription")}
      locale={params.locale as AppLocale}
      title={t("accountPageTitle")}
    >
      <div className={portalTheme.noteClass}>{t("accountReadOnlyNotice")}</div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={[portalTheme.subtleSurfaceClass, "p-5 md:col-span-2"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">{t("accountNameLabel")}</p>
              <p className="mt-3 text-lg font-semibold text-white">{user?.name ?? t("notAvailable")}</p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">{t("accountEmailLabel")}</p>
              <p className="mt-3 text-sm font-semibold text-white">{user?.email ?? t("notAvailable")}</p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">{t("accountTenantLabel")}</p>
              <p className="mt-3 text-sm font-semibold text-white">{user?.tenant?.name ?? t("notAvailable")}</p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">{t("accountLocaleLabel")}</p>
              <p className="mt-3 text-sm font-semibold text-white">{user?.locale ?? t("notAvailable")}</p>
            </div>
            <div className={[portalTheme.subtleSurfaceClass, "p-5"].join(" ")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ea4ca]">{t("accountLastLoginLabel")}</p>
              <p className="mt-3 text-sm font-semibold text-white">
                {user?.last_login_at
                  ? new Intl.DateTimeFormat(params.locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(user.last_login_at))
                  : t("notAvailable")}
              </p>
            </div>
          </div>
        </article>

        <aside className={[portalTheme.surfaceClass, "p-6 md:p-7"].join(" ")}>
          <h2 className="text-lg font-semibold text-white">{t("accountQuickActionsTitle")}</h2>
          <div className="mt-5 grid gap-3">
            <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/domains/register")}>
              {t("registerDomainButton")}
            </Link>
            <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/tickets/new")}>
              {t("contactSupportButton")}
            </Link>
            <Link className={portalTheme.secondaryButtonClass} href={localePath(params.locale, "/portal/knowledgebase")}>
              {t("submenuKnowledgebase")}
            </Link>
          </div>
        </aside>
      </section>
    </PortalShell>
  );
}
