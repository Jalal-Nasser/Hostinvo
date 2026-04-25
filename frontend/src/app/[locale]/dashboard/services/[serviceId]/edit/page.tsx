import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ServiceForm } from "@/components/provisioning/service-form";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchProductsFromCookies } from "@/lib/catalog";
import { fetchClientsFromCookies } from "@/lib/clients";
import { fetchServersFromCookies, fetchServiceFromCookies } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function EditServicePage({
  params,
}: Readonly<{
  params: { locale: string; serviceId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Provisioning");
  const cookieHeader = cookies().toString();
  const service = await fetchServiceFromCookies(cookieHeader, params.serviceId);

  if (!service) {
    notFound();
  }

  const [clientsResponse, productsResponse, serversResponse] = await Promise.all([
    fetchClientsFromCookies(cookieHeader, { per_page: "100" }),
    fetchProductsFromCookies(cookieHeader, { per_page: "100" }),
    fetchServersFromCookies(cookieHeader, { status: "active", per_page: "100" }),
  ]);

  return (
    <DashboardShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, `/dashboard/services/${service.id}`)}
          >
            {t("viewServiceButton")}
          </Link>
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, "/dashboard/services")}
          >
            {t("backToServicesButton")}
          </Link>
        </div>
      }
      currentPath={`/dashboard/services/${service.id}/edit`}
      description={t("editServiceDescription")}
      locale={params.locale as AppLocale}
      title={t("editServiceTitle")}
    >
      <ServiceForm
        clients={clientsResponse?.data ?? []}
        initialService={service}
        mode="edit"
        products={productsResponse?.data ?? []}
        servers={serversResponse?.data ?? []}
      />
    </DashboardShell>
  );
}
