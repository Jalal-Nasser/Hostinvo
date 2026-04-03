import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  params: {
    locale: string;
  };
};

export default async function SettingsPage({ params }: Readonly<SettingsPageProps>) {
  setRequestLocale(params.locale);
  const t = await getTranslations("Dashboard");

  return (
    <DashboardShell
      currentPath="/dashboard/settings"
      description={t("settingsDescription")}
      locale={params.locale as AppLocale}
      title={t("settingsTitle")}
    >
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <article className="glass-card p-6 md:p-8">
          <p className="dashboard-kicker">{t("settingsTitle")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
            {t("settingsPlaceholderTitle")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6b7280]">
            {t("settingsPlaceholderDescription")}
          </p>
        </article>

        <aside className="glass-card p-6 md:p-8">
          <p className="dashboard-kicker">{t("settingsSummaryTitle")}</p>
          <div className="mt-4 grid gap-3">
            {t.raw("settingsSummaryItems").map((item: string) => (
              <div
                key={item}
                className="rounded-xl border border-[#e5e7eb] bg-[#fcfcfb] px-4 py-3 text-sm font-medium text-[#33506f]"
              >
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
