import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ImpersonationReturn } from "@/components/platform-owner/impersonation-return";
import { type AppLocale } from "@/i18n/routing";
import {
  canAccessAdminWorkspace,
  canAccessClientPortal,
  defaultWorkspacePath,
  getAuthenticatedUserFromCookies,
  hasAnyPermission,
  hasRole,
  localePath,
  type WorkspaceMode,
} from "@/lib/auth";
import { fetchTenantBrandingFromCookies } from "@/lib/tenant-admin";

type WorkspaceShellProps = {
  locale: AppLocale;
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  headerStats?: React.ReactNode;
  tintedHeader?: boolean;
  mode: WorkspaceMode;
};

type WorkspaceNavSection = "primary" | "secondary";

type WorkspaceNavItem = {
  href: string;
  label: string;
  active: boolean;
  visible: boolean;
  icon:
    | "dashboard"
    | "clients"
    | "services"
    | "orders"
    | "invoices"
    | "payments"
    | "domains"
    | "support"
    | "servers"
    | "settings"
    | "products"
    | "groups"
    | "provisioning"
    | "tenants";
  section?: WorkspaceNavSection;
};

function SidebarIcon({
  icon,
  active,
}: {
  icon: WorkspaceNavItem["icon"];
  active: boolean;
}) {
  const strokeClass = active ? "text-[#036deb]" : "text-[#5f7389]";

  switch (icon) {
    case "dashboard":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5.5A1.5 1.5 0 015.5 4h4A1.5 1.5 0 0111 5.5v4A1.5 1.5 0 019.5 11h-4A1.5 1.5 0 014 9.5v-4zm9 0A1.5 1.5 0 0114.5 4h4A1.5 1.5 0 0120 5.5v7A1.5 1.5 0 0118.5 14h-4a1.5 1.5 0 01-1.5-1.5v-7zm-9 9A1.5 1.5 0 015.5 13h4a1.5 1.5 0 011.5 1.5v4A1.5 1.5 0 019.5 20h-4A1.5 1.5 0 014 18.5v-4zm9 3A1.5 1.5 0 0114.5 16h4a1.5 1.5 0 010 3h-4a1.5 1.5 0 010-3z" />
        </svg>
      );
    case "clients":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 19a4 4 0 00-8 0m8 0H8m8 0h2a2 2 0 002-2v-1a6 6 0 00-6-6m-4 9H6a2 2 0 01-2-2v-1a6 6 0 016-6m8-1a3 3 0 11-6 0 3 3 0 016 0zm-8 0a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "services":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7.5h16M7 4v3.5m10-3.5v3.5M5.5 20h13A1.5 1.5 0 0020 18.5v-11A1.5 1.5 0 0018.5 6h-13A1.5 1.5 0 004 7.5v11A1.5 1.5 0 005.5 20zm2.5-8h3m2 0h3m-8 4h8" />
        </svg>
      );
    case "orders":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h13l-1.4 7.01A2 2 0 0116.64 16H9.12a2 2 0 01-1.96-1.61L5 4H3m6 16a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
      );
    case "invoices":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4h7l5 5v9.5A1.5 1.5 0 0117.5 20h-10A1.5 1.5 0 016 18.5v-13A1.5 1.5 0 017.5 4zm7 1.5V10H18.5M9 13h6m-6 3h6" />
        </svg>
      );
    case "payments":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9A2.5 2.5 0 0117.5 19h-11A2.5 2.5 0 014 16.5v-9zm0 2.5h16m-4.5 4H17" />
        </svg>
      );
    case "domains":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 20a8 8 0 100-16 8 8 0 000 16zm0 0c2.3 0 4-3.58 4-8s-1.7-8-4-8-4 3.58-4 8 1.7 8 4 8zm-7-8h14M6.34 7h11.32M6.34 17h11.32" />
        </svg>
      );
    case "support":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10.5h8M8 14h5m-1-10a8 8 0 00-8 8v5l3-2h5a8 8 0 100-16z" />
        </svg>
      );
    case "servers":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.5 6h13A1.5 1.5 0 0120 7.5v3A1.5 1.5 0 0118.5 12h-13A1.5 1.5 0 014 10.5v-3A1.5 1.5 0 015.5 6zm0 6h13A1.5 1.5 0 0120 13.5v3a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 16.5v-3A1.5 1.5 0 015.5 12zM8 9h.01M8 15h.01" />
        </svg>
      );
    case "settings":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.3 4.32a1 1 0 011.4-.94l.99.4a1 1 0 00.9 0l.99-.4a1 1 0 011.4.94l.1 1.07a1 1 0 00.54.79l.95.53a1 1 0 01.27 1.53l-.68.84a1 1 0 000 .95l.68.84a1 1 0 01-.27 1.53l-.95.53a1 1 0 00-.54.79l-.1 1.07a1 1 0 01-1.4.94l-.99-.4a1 1 0 00-.9 0l-.99.4a1 1 0 01-1.4-.94l-.1-1.07a1 1 0 00-.54-.79l-.95-.53a1 1 0 01-.27-1.53l.68-.84a1 1 0 000-.95l-.68-.84a1 1 0 01.27-1.53l.95-.53a1 1 0 00.54-.79l.1-1.07zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "products":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7.5L12 4l5 3.5M7 7.5v6L12 17l5-3.5v-6M7 7.5L12 11l5-3.5" />
        </svg>
      );
    case "groups":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6.5A1.5 1.5 0 015.5 5h5A1.5 1.5 0 0112 6.5v3A1.5 1.5 0 0110.5 11h-5A1.5 1.5 0 014 9.5v-3zm8 0A1.5 1.5 0 0113.5 5h5A1.5 1.5 0 0120 6.5v3A1.5 1.5 0 0118.5 11h-5A1.5 1.5 0 0112 9.5v-3zm-8 8A1.5 1.5 0 015.5 13h5A1.5 1.5 0 0112 14.5v3a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 014 17.5v-3zm8 1.5h8" />
        </svg>
      );
    case "provisioning":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />
        </svg>
      );
    case "tenants":
      return (
        <svg className={`h-4.5 w-4.5 ${strokeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 18.5A2.5 2.5 0 016.5 16H10a2.5 2.5 0 012.5 2.5M6.5 8.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm7.5 10A2.5 2.5 0 0116.5 16H18a2.5 2.5 0 012.5 2.5M16.5 8.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zM10.5 12h3" />
        </svg>
      );
  }
}

function SidebarLink({ item }: { item: WorkspaceNavItem }) {
  return (
    <Link
      href={item.href}
      className={[
        "dashboard-sidebar-link",
        item.active ? "dashboard-sidebar-link-active" : "",
      ].join(" ")}
    >
      <span className="dashboard-sidebar-icon">
        <SidebarIcon active={item.active} icon={item.icon} />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export async function WorkspaceShell({
  locale,
  currentPath,
  title,
  description,
  children,
  actions,
  headerStats,
  tintedHeader = false,
  mode,
}: WorkspaceShellProps) {
  const cookieHeader = cookies().toString();
  const user = await getAuthenticatedUserFromCookies(cookieHeader);

  if (!user) {
    redirect(localePath(locale, "/auth/login"));
  }

  const dashboardT = await getTranslations("Dashboard");
  const portalT = await getTranslations("Portal");
  const provisioningT = await getTranslations("Provisioning");
  const workspaceT = await getTranslations("Workspace");

  const hasAdminWorkspace = canAccessAdminWorkspace(user);
  const hasPortalWorkspace = canAccessClientPortal(user);
  const isImpersonating = Boolean(user.impersonation?.active);
  const overviewHref = hasAdminWorkspace
    ? localePath(locale, "/dashboard")
    : defaultWorkspacePath(locale, user);
  const overviewLabel = hasAdminWorkspace
    ? dashboardT("overviewLink")
    : portalT("overviewLink");
  const workspaceBadge =
    mode === "portal" || !hasAdminWorkspace
      ? workspaceT("portalBadge")
      : workspaceT("adminBadge");
  const tenantBranding =
    mode === "admin" && hasAdminWorkspace
      ? await fetchTenantBrandingFromCookies(cookieHeader)
      : null;

  const adminNavigation: WorkspaceNavItem[] = [
    {
      href: overviewHref,
      label: overviewLabel,
      active: currentPath === "/dashboard" || currentPath === "/portal",
      visible: true,
      icon: "dashboard",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/tenants"),
      label: dashboardT("tenantsLink"),
      active:
        currentPath === "/dashboard/tenants" ||
        currentPath.startsWith("/dashboard/tenants/"),
      visible: hasRole(user, "super_admin"),
      icon: "tenants",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/clients"),
      label: dashboardT("clientsLink"),
      active:
        currentPath === "/dashboard/clients" ||
        currentPath.startsWith("/dashboard/clients/"),
      visible: hasAnyPermission(user, ["clients.view", "clients.manage"]),
      icon: "clients",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/services"),
      label: provisioningT("servicesTitle"),
      active:
        currentPath === "/dashboard/services" ||
        currentPath.startsWith("/dashboard/services/"),
      visible: hasAnyPermission(user, ["services.view", "services.manage"]),
      icon: "services",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/orders"),
      label: dashboardT("ordersLink"),
      active:
        currentPath === "/dashboard/orders" ||
        currentPath.startsWith("/dashboard/orders/"),
      visible: hasAnyPermission(user, ["orders.view", "orders.manage"]),
      icon: "orders",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/invoices"),
      label: dashboardT("invoicesLink"),
      active:
        currentPath === "/dashboard/invoices" ||
        currentPath.startsWith("/dashboard/invoices/"),
      visible: hasAnyPermission(user, ["invoices.view", "invoices.manage"]),
      icon: "invoices",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/payments"),
      label: dashboardT("paymentsLink"),
      active: currentPath === "/dashboard/payments",
      visible: hasAnyPermission(user, ["payments.view", "payments.manage"]),
      icon: "payments",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/domains"),
      label: dashboardT("domainsLink"),
      active:
        currentPath === "/dashboard/domains" ||
        currentPath.startsWith("/dashboard/domains/"),
      visible: hasAnyPermission(user, ["domains.view", "domains.manage"]),
      icon: "domains",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/support"),
      label: dashboardT("supportLink"),
      active:
        currentPath === "/dashboard/support" ||
        currentPath === "/dashboard/tickets" ||
        currentPath.startsWith("/dashboard/tickets/"),
      visible: hasAnyPermission(user, [
        "tickets.view",
        "tickets.manage",
        "tickets.reply",
        "ticket_departments.view",
        "ticket_departments.manage",
        "support.access",
      ]),
      icon: "support",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/servers"),
      label: provisioningT("serversTitle"),
      active:
        currentPath === "/dashboard/servers" ||
        currentPath.startsWith("/dashboard/servers/"),
      visible: hasAnyPermission(user, ["servers.view", "servers.manage"]),
      icon: "servers",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/settings"),
      label: dashboardT("settingsLink"),
      active:
        currentPath === "/dashboard/settings" ||
        currentPath.startsWith("/dashboard/settings/") ||
        currentPath.startsWith("/dashboard/content"),
      visible: hasAdminWorkspace,
      icon: "settings",
      section: "primary",
    },
    {
      href: localePath(locale, "/dashboard/products"),
      label: dashboardT("productsLink"),
      active:
        currentPath === "/dashboard/products" ||
        currentPath.startsWith("/dashboard/products/"),
      visible: hasAnyPermission(user, ["products.view", "products.manage"]),
      icon: "products",
      section: "secondary",
    },
    {
      href: localePath(locale, "/dashboard/product-groups"),
      label: dashboardT("productGroupsLink"),
      active: currentPath === "/dashboard/product-groups",
      visible: hasAnyPermission(user, ["product_groups.view", "product_groups.manage"]),
      icon: "groups",
      section: "secondary",
    },
    {
      href: localePath(locale, "/dashboard/provisioning"),
      label: provisioningT("jobsTitle"),
      active: currentPath === "/dashboard/provisioning",
      visible: hasAnyPermission(user, ["provisioning.view", "provisioning.manage"]),
      icon: "provisioning",
      section: "secondary",
    },
  ];

  const portalNavigation: WorkspaceNavItem[] = [
    {
      href: localePath(locale, "/portal"),
      label: portalT("overviewLink"),
      active: currentPath === "/portal",
      visible: true,
      icon: "dashboard",
    },
    {
      href: localePath(locale, "/portal/domains"),
      label: portalT("domainsLink"),
      active:
        currentPath === "/portal/domains" || currentPath.startsWith("/portal/domains/"),
      visible: hasAnyPermission(user, ["client.portal.access"]),
      icon: "domains",
    },
    {
      href: localePath(locale, "/dashboard/services"),
      label: portalT("servicesLink"),
      active:
        currentPath === "/dashboard/services" ||
        currentPath.startsWith("/dashboard/services/"),
      visible: hasAnyPermission(user, ["services.view", "services.manage"]),
      icon: "services",
    },
    {
      href: localePath(locale, "/dashboard/invoices"),
      label: portalT("invoicesLink"),
      active:
        currentPath === "/dashboard/invoices" ||
        currentPath.startsWith("/dashboard/invoices/"),
      visible: hasAnyPermission(user, ["invoices.view", "invoices.manage"]),
      icon: "invoices",
    },
    {
      href: localePath(locale, "/portal/tickets"),
      label: portalT("ticketsLink"),
      active:
        currentPath === "/portal/tickets" ||
        currentPath.startsWith("/portal/tickets/"),
      visible: hasAnyPermission(user, ["tickets.view", "tickets.manage", "tickets.reply"]),
      icon: "support",
    },
    {
      href: localePath(locale, "/dashboard/provisioning"),
      label: portalT("provisioningLink"),
      active: currentPath === "/dashboard/provisioning",
      visible: hasAnyPermission(user, ["provisioning.view", "provisioning.manage"]),
      icon: "provisioning",
    },
  ];

  if (mode === "admin") {
    const primaryNavigation = adminNavigation.filter(
      (item) => item.visible && item.section !== "secondary",
    );
    const secondaryNavigation = adminNavigation.filter(
      (item) => item.visible && item.section === "secondary",
    );

    return (
      <main className="dashboard-workspace min-h-screen bg-[#faf9f5]">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="dashboard-sidebar-surface h-fit lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
              <div className="flex items-center justify-between gap-3">
                <BrandLogo
                  href={localePath(locale, "/")}
                  className="block w-[9.5rem] shrink-0"
                  src={tenantBranding?.logo_url}
                  alt={tenantBranding?.portal_name || tenantBranding?.company_name || "Hostinvo"}
                />
                <span className="rounded-lg bg-[#eff6ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#036deb]">
                  {workspaceBadge}
                </span>
              </div>

              <div className="mt-6 rounded-xl border border-[#e5e7eb] bg-[#faf9f5] p-4">
                <p className="dashboard-kicker">{dashboardT("tenantLabel")}</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#0a1628]">
                  {user.tenant?.name ?? workspaceT("adminBadge")}
                </p>
                <p className="mt-2 text-sm text-[#6b7280]">
                  {user.tenant?.slug ?? user.email}
                </p>
              </div>

              <nav aria-label={workspaceT("navigationLabel")} className="mt-6 space-y-6">
                <div className="space-y-2">
                  {primaryNavigation.map((item) => (
                    <SidebarLink key={item.href} item={item} />
                  ))}
                </div>

                {secondaryNavigation.length > 0 ? (
                  <div className="space-y-2 border-t border-[#eef2f7] pt-6">
                    {secondaryNavigation.map((item) => (
                      <SidebarLink key={item.href} item={item} />
                    ))}
                  </div>
                ) : null}
              </nav>

              {hasPortalWorkspace ? (
                <div className="mt-6 rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-4">
                  <p className="dashboard-kicker">{workspaceT("portalBadge")}</p>
                  <p className="mt-2 text-sm leading-6 text-[#33506f]">
                    {workspaceT("switchToPortal")}
                  </p>
                  <Link className="btn-secondary mt-4 w-full" href={localePath(locale, "/portal")}>
                    {workspaceT("switchToPortal")}
                  </Link>
                </div>
              ) : null}
            </aside>

            <div className="min-w-0 space-y-6">
              <section className={tintedHeader ? "dashboard-header-surface" : "dashboard-shell-surface"}>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_max-content] xl:items-start">
                  <div className="min-w-0">
                    <p className="dashboard-kicker">{workspaceBadge}</p>
                    <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.05em] text-[#0a1628] md:text-[2.35rem]">
                      {title}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6b7280]">
                      {description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#6b7280]">
                      <span className="rounded-lg border border-[#e5e7eb] bg-[#fcfcfb] px-3 py-1.5 font-medium text-[#123055]">
                        {user.tenant?.name ?? workspaceT("adminBadge")}
                      </span>
                      <span>{user.name}</span>
                      <span className="text-[#c0cad5]">/</span>
                      <span>{user.email}</span>
                      {user.roles.slice(0, 2).map((role) => (
                        <span
                          key={role.id}
                          className="rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#516578]"
                        >
                          {role.display_name}
                        </span>
                      ))}
                    </div>

                    {headerStats ? (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {headerStats}
                      </div>
                    ) : null}
                  </div>

                  <div className="xl:min-w-max xl:pt-1">
                    <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap xl:justify-end">
                      {hasPortalWorkspace ? (
                        <Link
                          className="btn-ghost whitespace-nowrap border border-[#e5e7eb] bg-white"
                          href={localePath(locale, "/portal")}
                        >
                          {workspaceT("switchToPortal")}
                        </Link>
                      ) : null}

                      {isImpersonating ? <ImpersonationReturn locale={locale} /> : null}
                      <LocaleSwitcher currentLocale={locale} path={currentPath} />
                      <LogoutButton />
                      {actions}
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid gap-6">{children}</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const navigation = portalNavigation.filter((item) => item.visible);

  return (
    <main className="min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="glass-card p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <BrandLogo
                  href={localePath(locale, "/")}
                  className="block w-[11rem] shrink-0"
                />
                <span className="rounded-full border border-line bg-[#faf9f5]/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                  {workspaceBadge}
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-foreground">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{description}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {hasAdminWorkspace ? (
                  <Link
                    href={localePath(locale, "/dashboard")}
                    className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                  >
                    {workspaceT("switchToAdmin")}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              {actions ? (
                <div className="flex flex-wrap items-center justify-start gap-3 self-stretch lg:justify-end lg:self-auto">
                  {actions}
                </div>
              ) : null}
              <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/75 px-4 py-3 text-sm text-muted">
                <p className="font-semibold text-foreground">{user.name}</p>
                <p className="mt-1">{user.email}</p>
              </div>
              <LocaleSwitcher currentLocale={locale} path={currentPath} />
              <LogoutButton />
            </div>
          </div>
        </header>

        {navigation.length > 0 ? (
          <nav
            aria-label={workspaceT("navigationLabel")}
            className="flex flex-wrap gap-3"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  item.active
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-[#faf9f5]/75 text-foreground hover:bg-accentSoft",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {children}
      </div>
    </main>
  );
}
