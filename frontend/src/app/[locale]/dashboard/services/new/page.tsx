import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ServiceForm } from "@/components/provisioning/service-form";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProductsFromCookies } from "@/lib/catalog";
import { fetchClientsFromCookies } from "@/lib/clients";
import { fetchServersFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function NewServicePage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Provisioning");
  const cookieHeader = cookies().toString();
  const [clientsResponse, productsResponse, serversResponse] = await Promise.all([
    fetchClientsFromCookies(cookieHeader, { per_page: "100" }),
    fetchProductsFromCookies(cookieHeader, { status: "active", per_page: "100" }),
    fetchServersFromCookies(cookieHeader, { status: "active", per_page: "100" }),
  ]);

  return (
    <DashboardShell
      actions={
        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={localePath(params.locale, "/dashboard/services")}
        >
          {t("backToServicesButton")}
        </Link>
      }
      currentPath="/dashboard/services/new"
      description={t("createServiceDescription")}
      locale={params.locale as AppLocale}
      title={t("createServiceTitle")}
    >
      <ServiceForm
        clients={clientsResponse?.data ?? []}
        products={productsResponse?.data ?? []}
        servers={serversResponse?.data ?? []}
      />
    </DashboardShell>
  );
}
