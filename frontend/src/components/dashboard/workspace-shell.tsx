import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { DemoTenantDashboardButton } from "@/components/platform-owner/demo-tenant-dashboard-button";
import { ImpersonationReturn } from "@/components/platform-owner/impersonation-return";
import { DocumentTitle } from "@/components/shared/document-title";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { type AppLocale } from "@/i18n/routing";
import {
  canAccessAdminWorkspace,
  canAccessClientPortal,
  defaultWorkspacePath,
  getAuthenticatedUserFromCookies,
  hasActiveTenantContext,
  hasAnyPermission,
  hasRole,
  isPlatformOwnerContext,
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

type WorkspaceNavGroup = "core" | "operations" | "catalog";

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
    | "licenses"
    | "domains"
    | "support"
    | "servers"
    | "settings"
    | "products"
    | "groups"
    | "addons"
    | "provisioning"
    | "tenants";
  group?: WorkspaceNavGroup;
  children?: WorkspaceNavItem[];
};

function SidebarIcon({ icon }: { icon: WorkspaceNavItem["icon"] }) {
  const common = {
    className: "h-4 w-4",
    fill: "none" as const,
    stroke: "currentColor" as const,
    viewBox: "0 0 24 24",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M4 5.5A1.5 1.5 0 015.5 4h4A1.5 1.5 0 0111 5.5v4A1.5 1.5 0 019.5 11h-4A1.5 1.5 0 014 9.5v-4zm9 0A1.5 1.5 0 0114.5 4h4A1.5 1.5 0 0120 5.5v7A1.5 1.5 0 0118.5 14h-4a1.5 1.5 0 01-1.5-1.5v-7zm-9 9A1.5 1.5 0 015.5 13h4a1.5 1.5 0 011.5 1.5v4A1.5 1.5 0 019.5 20h-4A1.5 1.5 0 014 18.5v-4zm9 3A1.5 1.5 0 0114.5 16h4a1.5 1.5 0 010 3h-4a1.5 1.5 0 010-3z" />
        </svg>
      );
    case "clients":
      return (
        <svg {...common}>
          <path d="M16 19a4 4 0 00-8 0m8 0H8m8 0h2a2 2 0 002-2v-1a6 6 0 00-6-6m-4 9H6a2 2 0 01-2-2v-1a6 6 0 016-6m8-1a3 3 0 11-6 0 3 3 0 016 0zm-8 0a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "services":
      return (
        <svg {...common}>
          <path d="M4 7.5h16M7 4v3.5m10-3.5v3.5M5.5 20h13A1.5 1.5 0 0020 18.5v-11A1.5 1.5 0 0018.5 6h-13A1.5 1.5 0 004 7.5v11A1.5 1.5 0 005.5 20zm2.5-8h3m2 0h3m-8 4h8" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path d="M7 7h13l-1.4 7.01A2 2 0 0116.64 16H9.12a2 2 0 01-1.96-1.61L5 4H3m6 16a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
      );
    case "invoices":
      return (
        <svg {...common}>
          <path d="M7 4h7l5 5v9.5A1.5 1.5 0 0117.5 20h-10A1.5 1.5 0 016 18.5v-13A1.5 1.5 0 017.5 4zm7 1.5V10H18.5M9 13h6m-6 3h6" />
        </svg>
      );
    case "payments":
      return (
        <svg {...common}>
          <path d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9A2.5 2.5 0 0117.5 19h-11A2.5 2.5 0 014 16.5v-9zm0 2.5h16m-4.5 4H17" />
        </svg>
      );
    case "licenses":
      return (
        <svg {...common}>
          <path d="M7 5h8l4 4v9.5A1.5 1.5 0 0117.5 20h-10A1.5 1.5 0 016 18.5v-12A1.5 1.5 0 017.5 5zm8 1.5V10H19.5M9 13h6m-6 3h6" />
        </svg>
      );
    case "domains":
      return (
        <svg {...common}>
          <path d="M12 20a8 8 0 100-16 8 8 0 000 16zm0 0c2.3 0 4-3.58 4-8s-1.7-8-4-8-4 3.58-4 8 1.7 8 4 8zm-7-8h14M6.34 7h11.32M6.34 17h11.32" />
        </svg>
      );
    case "support":
      return (
        <svg {...common}>
          <path d="M8 10.5h8M8 14h5m-1-10a8 8 0 00-8 8v5l3-2h5a8 8 0 100-16z" />
        </svg>
      );
    case "servers":
      return (
        <svg {...common}>
          <path d="M5.5 6h13A1.5 1.5 0 0120 7.5v3A1.5 1.5 0 0118.5 12h-13A1.5 1.5 0 014 10.5v-3A1.5 1.5 0 015.5 6zm0 6h13A1.5 1.5 0 0120 13.5v3a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 16.5v-3A1.5 1.5 0 015.5 12zM8 9h.01M8 15h.01" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M10.3 4.32a1 1 0 011.4-.94l.99.4a1 1 0 00.9 0l.99-.4a1 1 0 011.4.94l.1 1.07a1 1 0 00.54.79l.95.53a1 1 0 01.27 1.53l-.68.84a1 1 0 000 .95l.68.84a1 1 0 01-.27 1.53l-.95.53a1 1 0 00-.54.79l-.1 1.07a1 1 0 01-1.4.94l-.99-.4a1 1 0 00-.9 0l-.99.4a1 1 0 01-1.4-.94l-.1-1.07a1 1 0 00-.54-.79l-.95-.53a1 1 0 01-.27-1.53l.68-.84a1 1 0 000-.95l-.68-.84a1 1 0 01.27-1.53l.95-.53a1 1 0 00.54-.79l.1-1.07zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "products":
      return (
        <svg {...common}>
          <path d="M7 7.5L12 4l5 3.5M7 7.5v6L12 17l5-3.5v-6M7 7.5L12 11l5-3.5" />
        </svg>
      );
    case "groups":
      return (
        <svg {...common}>
          <path d="M4 6.5A1.5 1.5 0 015.5 5h5A1.5 1.5 0 0112 6.5v3A1.5 1.5 0 0110.5 11h-5A1.5 1.5 0 014 9.5v-3zm8 0A1.5 1.5 0 0113.5 5h5A1.5 1.5 0 0120 6.5v3A1.5 1.5 0 0118.5 11h-5A1.5 1.5 0 0112 9.5v-3zm-8 8A1.5 1.5 0 015.5 13h5A1.5 1.5 0 0112 14.5v3a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 014 17.5v-3zm8 1.5h8" />
        </svg>
      );
    case "addons":
      return (
        <svg {...common}>
          <path d="M7 7h10v10H7zM4 12h3m10 0h3M12 4v3m0 10v3" />
        </svg>
      );
    case "provisioning":
      return (
        <svg {...common}>
          <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />
        </svg>
      );
    case "tenants":
      return (
        <svg {...common}>
          <path d="M4 18.5A2.5 2.5 0 016.5 16H10a2.5 2.5 0 012.5 2.5M6.5 8.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm7.5 10A2.5 2.5 0 0116.5 16H18a2.5 2.5 0 012.5 2.5M16.5 8.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zM10.5 12h3" />
        </svg>
      );
  }
}

function SidebarLink({ item, depth = 0 }: { item: WorkspaceNavItem; depth?: number }) {
  return (
    <div>
      <Link
        href={item.href}
        className={[
          "dashboard-sidebar-link",
          item.active ? "dashboard-sidebar-link-active" : "",
          depth > 0 ? "ps-9 text-[12.5px]" : "",
        ].join(" ")}
      >
        {depth === 0 ? (
          <span className="dashboard-sidebar-icon">
            <SidebarIcon icon={item.icon} />
          </span>
        ) : (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-45" />
        )}
        <span className="truncate">{item.label}</span>
      </Link>
      {item.children?.some((child) => child.visible) ? (
        <div className="mt-0.5 space-y-0.5">
          {item.children
            .filter((child) => child.visible)
            .map((child) => (
              <SidebarLink key={child.href} item={child} depth={depth + 1} />
            ))}
        </div>
      ) : null}
    </div>
  );
}

function tenantInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "HV";
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
  const activeTenant = user.active_tenant ?? user.tenant ?? null;

  const hasAdminWorkspace = canAccessAdminWorkspace(user);
  const isPlatformOwner = isPlatformOwnerContext(user);
  const hasPortalWorkspace = canAccessClientPortal(user);
  const hasTenantContextReturn = hasRole(user, "super_admin") && hasActiveTenantContext(user);
  const isTenantAdmin = hasRole(user, "tenant_admin") && !isPlatformOwner;
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
      group: "core",
    },
    {
      href: localePath(locale, "/dashboard/tenants"),
      label: dashboardT("tenantsLink"),
      active:
        currentPath === "/dashboard/tenants" ||
        currentPath.startsWith("/dashboard/tenants/"),
      visible: hasRole(user, "super_admin") && !hasActiveTenantContext(user),
      icon: "tenants",
      group: "core",
    },
    {
      href: localePath(locale, "/dashboard/clients"),
      label: dashboardT("clientsLink"),
      active:
        currentPath === "/dashboard/clients" ||
        currentPath.startsWith("/dashboard/clients/"),
      visible: hasAnyPermission(user, ["clients.view", "clients.manage"]),
      icon: "clients",
      group: "core",
    },
    {
      href: localePath(locale, "/dashboard/services"),
      label: provisioningT("servicesTitle"),
      active:
        currentPath === "/dashboard/services" ||
        currentPath.startsWith("/dashboard/services/"),
      visible: hasAnyPermission(user, ["services.view", "services.manage"]),
      icon: "services",
      group: "operations",
    },
    {
      href: localePath(locale, "/dashboard/orders"),
      label: dashboardT("ordersLink"),
      active:
        currentPath === "/dashboard/orders" ||
        currentPath.startsWith("/dashboard/orders/"),
      visible: hasAnyPermission(user, ["orders.view", "orders.manage"]),
      icon: "orders",
      group: "operations",
    },
    {
      href: localePath(locale, "/dashboard/invoices"),
      label: dashboardT("invoicesLink"),
      active:
        currentPath === "/dashboard/invoices" ||
        currentPath.startsWith("/dashboard/invoices/"),
      visible: hasAnyPermission(user, ["invoices.view", "invoices.manage"]),
      icon: "invoices",
      group: "operations",
    },
    {
      href: localePath(locale, "/dashboard/payments"),
      label: dashboardT("paymentsLink"),
      active: currentPath === "/dashboard/payments",
      visible: hasAnyPermission(user, ["payments.view", "payments.manage"]),
      icon: "payments",
      group: "operations",
    },
    {
      href: localePath(locale, "/dashboard/domains"),
      label: dashboardT("domainsLink"),
      active:
        currentPath === "/dashboard/domains" ||
        currentPath.startsWith("/dashboard/domains/"),
      visible: hasAnyPermission(user, ["domains.view", "domains.manage"]),
      icon: "domains",
      group: "operations",
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
      group: "operations",
    },
    {
      href: localePath(locale, "/dashboard/servers"),
      label: provisioningT("serversTitle"),
      active:
        currentPath === "/dashboard/servers" ||
        currentPath.startsWith("/dashboard/servers/"),
      visible: hasAnyPermission(user, ["servers.view", "servers.manage"]),
      icon: "servers",
      group: "catalog",
    },
    {
      href: localePath(locale, "/dashboard/products"),
      label: dashboardT("productsLink"),
      active:
        currentPath === "/dashboard/products" ||
        currentPath.startsWith("/dashboard/products/"),
      visible: hasAnyPermission(user, ["products.view", "products.manage"]),
      icon: "products",
      group: "catalog",
    },
    {
      href: localePath(locale, "/dashboard/product-groups"),
      label: dashboardT("productGroupsLink"),
      active: currentPath === "/dashboard/product-groups",
      visible: hasAnyPermission(user, ["product_groups.view", "product_groups.manage"]),
      icon: "groups",
      group: "catalog",
    },
    {
      href: localePath(locale, "/dashboard/product-addons"),
      label: dashboardT("productAddonsLink"),
      active:
        currentPath === "/dashboard/product-addons" ||
        currentPath.startsWith("/dashboard/product-addons/"),
      visible: hasAnyPermission(user, ["products.view", "products.manage"]),
      icon: "addons",
      group: "catalog",
    },
    {
      href: localePath(locale, "/dashboard/provisioning"),
      label: provisioningT("jobsTitle"),
      active: currentPath === "/dashboard/provisioning",
      visible: hasAnyPermission(user, ["provisioning.view", "provisioning.manage"]),
      icon: "provisioning",
      group: "catalog",
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
      group: "catalog",
      children: [
        {
          href: localePath(locale, "/dashboard/settings/import/whmcs"),
          label: locale === "ar" ? "Import" : "Import",
          active: currentPath === "/dashboard/settings/import/whmcs",
          visible: isTenantAdmin,
          icon: "settings",
          children: [
            {
              href: localePath(locale, "/dashboard/settings/import/whmcs"),
              label: locale === "ar" ? "WHMCS Migration" : "WHMCS Migration",
              active: currentPath === "/dashboard/settings/import/whmcs",
              visible: isTenantAdmin,
              icon: "settings",
            },
          ],
        },
      ],
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
    const platformOwnerNavigation: WorkspaceNavItem[] = [
      {
        href: overviewHref,
        label: overviewLabel,
        active: currentPath === "/dashboard" || currentPath === "/portal",
        visible: true,
        icon: "dashboard",
        group: "core",
      },
      {
        href: localePath(locale, "/dashboard/tenants"),
        label: dashboardT("tenantsLink"),
        active:
          currentPath === "/dashboard/tenants" ||
          currentPath.startsWith("/dashboard/tenants/"),
        visible: true,
        icon: "tenants",
        group: "core",
      },
      {
        href: localePath(locale, "/dashboard/orders"),
        label: dashboardT("ordersLink"),
        active:
          currentPath === "/dashboard/orders" ||
          currentPath.startsWith("/dashboard/orders/"),
        visible: true,
        icon: "orders",
        group: "operations",
      },
      {
        href: localePath(locale, "/dashboard/plans"),
        label: dashboardT("platformPlansLink"),
        active: currentPath === "/dashboard/plans",
        visible: true,
        icon: "products",
        group: "operations",
      },
      {
        href: localePath(locale, "/dashboard/licenses"),
        label: dashboardT("licenseBillingLink"),
        active: currentPath === "/dashboard/licenses",
        visible: true,
        icon: "licenses",
        group: "operations",
      },
      {
        href: localePath(locale, "/dashboard/settings"),
        label: dashboardT("settingsLink"),
        active:
          currentPath === "/dashboard/settings" ||
          currentPath.startsWith("/dashboard/settings/") ||
          currentPath.startsWith("/dashboard/content"),
        visible: true,
        icon: "settings",
        group: "catalog",
      },
    ];

    const navigationSource = isPlatformOwner ? platformOwnerNavigation : adminNavigation;
    const visible = navigationSource.filter((item) => item.visible);
    const groupLabels: Record<WorkspaceNavGroup, string> =
      locale === "ar"
        ? { core: "عام", operations: "العمليات", catalog: "الكتالوج" }
        : { core: "General", operations: "Operations", catalog: "Catalog" };
    const groupedNav: Array<{ group: WorkspaceNavGroup; items: WorkspaceNavItem[] }> = (
      ["core", "operations", "catalog"] as WorkspaceNavGroup[]
    )
      .map((group) => ({
        group,
        items: visible.filter((item) => item.group === group),
      }))
      .filter((entry) => entry.items.length > 0);

    const tenantName = activeTenant?.name ?? workspaceT("adminBadge");
    const tenantMeta = activeTenant?.slug ?? user.email;
    const documentTitleBrand =
      tenantBranding?.portal_name?.trim() ||
      tenantBranding?.company_name?.trim() ||
      "Hostinvo";

    const cookieStore = await cookies();
    const initialTheme = cookieStore.get("hv_theme")?.value === "light" ? "light" : "dark";
    const themeClass = initialTheme === "light" ? "dashboard-light" : "dashboard-dark";

    return (
      <main className={`dashboard-workspace ${themeClass} min-h-screen`}>
        <DocumentTitle brand={documentTitleBrand} title={title} />
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
            {/* ───────────── Sidebar ───────────── */}
            <aside className="dashboard-sidebar-surface flex h-fit flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
              {/* Brand */}
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <BrandLogo
                  href={localePath(locale, "/")}
                  className="block w-[8.5rem] shrink-0"
                  src={tenantBranding?.logo_url}
                  alt={tenantBranding?.portal_name || tenantBranding?.company_name || "Hostinvo"}
                />
                <span className="rounded-md bg-[rgba(59,130,246,0.15)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#60a5fa]">
                  {workspaceBadge}
                </span>
              </div>

              {/* Active tenant chip */}
              <div className="mx-2 mt-3 flex items-center gap-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1a2540] px-2.5 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] text-[11px] font-bold tracking-wide text-white">
                  {tenantInitials(tenantName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[#e5e7eb]">
                    {tenantName}
                  </p>
                  <p className="truncate text-[11px] text-[#4b5563]">{tenantMeta}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav aria-label={workspaceT("navigationLabel")} className="mt-3 flex-1 px-1">
                {groupedNav.map((entry, index) => (
                  <div
                    key={entry.group}
                    className={index > 0 ? "mt-4 border-t border-[rgba(255,255,255,0.06)] pt-3" : undefined}
                  >
                    <p className="dashboard-sidebar-section-label">{groupLabels[entry.group]}</p>
                    <div className="space-y-0.5">
                      {entry.items.map((item) => (
                        <SidebarLink key={item.href} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Workspace switches + user footer */}
              {hasRole(user, "super_admin") ? (
                <div className="mx-2 mt-4 rounded-lg border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.08)] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
                    {workspaceT("demoTenantDashboardBadge")}
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-5 text-[#9ca3af]">
                    {workspaceT("demoTenantDashboardDescription")}
                  </p>
                  <DemoTenantDashboardButton locale={locale} />
                </div>
              ) : null}

              {hasPortalWorkspace ? (
                <div className="mx-2 mt-4 rounded-lg border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.08)] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
                    {workspaceT("portalBadge")}
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-5 text-[#9ca3af]">
                    {workspaceT("switchToPortal")}
                  </p>
                  <Link
                    className="mt-2.5 inline-flex w-full items-center justify-center rounded-md border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] px-3 py-1.5 text-[12px] font-semibold text-[#60a5fa] transition hover:bg-[rgba(59,130,246,0.18)]"
                    href={localePath(locale, "/portal")}
                  >
                    {workspaceT("switchToPortal")}
                  </Link>
                </div>
              ) : null}

              <div className="mx-2 mb-1 mt-4 flex items-center gap-2.5 border-t border-[rgba(255,255,255,0.06)] pt-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e2a3d] text-[11px] font-semibold text-[#9ca3af]">
                  {tenantInitials(user.name || user.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-[#e5e7eb]">{user.name}</p>
                  <p className="truncate text-[11px] text-[#4b5563]">{user.email}</p>
                </div>
                <ThemeSwitcher initialTheme={initialTheme} />
                <LogoutButton />
              </div>
            </aside>

            {/* ───────────── Main content ───────────── */}
            <div className="min-w-0 space-y-5">
              {hasTenantContextReturn && activeTenant ? (
                <section className="rounded-lg border border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.1)] px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#60a5fa]">
                        {workspaceT("tenantContextLabel")}
                      </p>
                      <p className="mt-1 truncate text-[13.5px] font-semibold text-[#e5e7eb]">
                        {workspaceT("viewingTenantDashboard", { tenant: activeTenant.name })}
                      </p>
                    </div>
                    <ImpersonationReturn
                      className="shrink-0"
                      locale={locale}
                      variant="default"
                    />
                  </div>
                </section>
              ) : null}

              <section className={tintedHeader ? "dashboard-header-surface" : "dashboard-shell-surface"}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    {/* Breadcrumb / kicker row */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-[#4b5563]">
                      <span className="font-semibold uppercase tracking-[0.18em] text-[#3b82f6]">
                        {workspaceBadge}
                      </span>
                      <span className="text-[#374151]">/</span>
                      <span className="font-medium text-[#6b7280]">
                        {activeTenant?.name ?? workspaceT("adminBadge")}
                      </span>
                      {user.roles.slice(0, 1).map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]"
                        >
                          {role.display_name}
                        </span>
                      ))}
                    </div>

                    <h1 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.035em] text-[#f1f5fb] md:text-[2rem]">
                      {title}
                    </h1>
                    <p className="mt-2 max-w-3xl text-[13.5px] leading-6 text-[#6b7280]">
                      {description}
                    </p>

                    {headerStats ? (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {headerStats}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    {hasTenantContextReturn ? <ImpersonationReturn locale={locale} /> : null}
                    {actions}
                  </div>
                </div>
              </section>

              <div className="grid gap-5">{children}</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const navigation = portalNavigation.filter((item) => item.visible);

  return (
    <main className="min-h-screen bg-[#faf9f5] px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="mx-auto grid max-w-6xl gap-5">
        <header className="dashboard-shell-surface">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <BrandLogo
                  href={localePath(locale, "/")}
                  className="block w-[10rem] shrink-0"
                />
                <span className="rounded-md bg-[#eff6ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#036deb]">
                  {workspaceBadge}
                </span>
              </div>
              <h1 className="mt-4 text-[1.85rem] font-semibold tracking-[-0.035em] text-[#0a1628] md:text-[2.1rem]">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-[#475467]">
                {description}
              </p>
              {hasAdminWorkspace ? (
                <div className="mt-4">
                  <Link href={localePath(locale, "/dashboard")} className="btn-secondary">
                    {workspaceT("switchToAdmin")}
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              {actions ? (
                <div className="flex flex-wrap items-center justify-start gap-2 self-stretch lg:justify-end lg:self-auto">
                  {actions}
                </div>
              ) : null}
              <div className="rounded-lg border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-2 text-[12.5px]">
                <p className="font-semibold text-[#0a1628]">{user.name}</p>
                <p className="mt-0.5 text-[#667085]">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <LogoutButton />
              </div>
            </div>
          </div>
        </header>

        {navigation.length > 0 ? (
          <nav
            aria-label={workspaceT("navigationLabel")}
            className="flex flex-wrap gap-1.5 rounded-xl border border-[#e5e7eb] bg-white p-1.5 shadow-[var(--shadow-xs)]"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition",
                  item.active
                    ? "bg-[#eff6ff] text-[#036deb]"
                    : "text-[#475467] hover:bg-[#f9fafb] hover:text-[#0a1628]",
                ].join(" ")}
              >
                <span className="inline-flex h-4 w-4">
                  <SidebarIcon icon={item.icon} />
                </span>
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
