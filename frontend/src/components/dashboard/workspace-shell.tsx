import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { type AppLocale } from "@/i18n/routing";
import {
  canAccessAdminWorkspace,
  canAccessClientPortal,
  defaultWorkspacePath,
  getAuthenticatedUserFromCookies,
  hasAnyPermission,
  localePath,
  type WorkspaceMode,
} from "@/lib/auth";

type WorkspaceShellProps = {
  locale: AppLocale;
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  mode: WorkspaceMode;
};

type WorkspaceNavItem = {
  href: string;
  label: string;
  active: boolean;
  visible: boolean;
};

export async function WorkspaceShell({
  locale,
  currentPath,
  title,
  description,
  children,
  actions,
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

  const adminNavigation: WorkspaceNavItem[] = [
    {
      href: overviewHref,
      label: overviewLabel,
      active: currentPath === "/dashboard" || currentPath === "/portal",
      visible: true,
    },
    {
      href: localePath(locale, "/dashboard/clients"),
      label: dashboardT("clientsLink"),
      active:
        currentPath === "/dashboard/clients" ||
        (currentPath.startsWith("/dashboard/clients/") &&
          currentPath !== "/dashboard/clients/new"),
      visible: hasAnyPermission(user, ["clients.view", "clients.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/clients/new"),
      label: dashboardT("newClientLink"),
      active: currentPath === "/dashboard/clients/new",
      visible: hasAnyPermission(user, ["clients.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/product-groups"),
      label: dashboardT("productGroupsLink"),
      active: currentPath === "/dashboard/product-groups",
      visible: hasAnyPermission(user, ["product_groups.view", "product_groups.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/products"),
      label: dashboardT("productsLink"),
      active:
        currentPath === "/dashboard/products" ||
        (currentPath.startsWith("/dashboard/products/") &&
          currentPath !== "/dashboard/products/new"),
      visible: hasAnyPermission(user, ["products.view", "products.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/products/new"),
      label: dashboardT("newProductLink"),
      active: currentPath === "/dashboard/products/new",
      visible: hasAnyPermission(user, ["products.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/orders"),
      label: dashboardT("ordersLink"),
      active:
        currentPath === "/dashboard/orders" ||
        (currentPath.startsWith("/dashboard/orders/") &&
          currentPath !== "/dashboard/orders/new" &&
          currentPath !== "/dashboard/orders/checkout-review"),
      visible: hasAnyPermission(user, ["orders.view", "orders.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/orders/new"),
      label: dashboardT("newOrderLink"),
      active:
        currentPath === "/dashboard/orders/new" ||
        currentPath === "/dashboard/orders/checkout-review",
      visible: hasAnyPermission(user, ["orders.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/invoices"),
      label: dashboardT("invoicesLink"),
      active:
        currentPath === "/dashboard/invoices" ||
        (currentPath.startsWith("/dashboard/invoices/") &&
          currentPath !== "/dashboard/invoices/new"),
      visible: hasAnyPermission(user, ["invoices.view", "invoices.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/invoices/new"),
      label: dashboardT("newInvoiceLink"),
      active: currentPath === "/dashboard/invoices/new",
      visible: hasAnyPermission(user, ["invoices.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/payments"),
      label: dashboardT("paymentsLink"),
      active: currentPath === "/dashboard/payments",
      visible: hasAnyPermission(user, ["payments.view", "payments.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/domains"),
      label: dashboardT("domainsLink"),
      active:
        currentPath === "/dashboard/domains" ||
        (currentPath.startsWith("/dashboard/domains/") &&
          currentPath !== "/dashboard/domains/new"),
      visible: hasAnyPermission(user, ["domains.view", "domains.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/domains/new"),
      label: dashboardT("newDomainLink"),
      active: currentPath === "/dashboard/domains/new",
      visible: hasAnyPermission(user, ["domains.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/tickets"),
      label: dashboardT("ticketsLink"),
      active:
        currentPath === "/dashboard/tickets" ||
        (currentPath.startsWith("/dashboard/tickets/") &&
          currentPath !== "/dashboard/tickets/new"),
      visible: hasAnyPermission(user, ["tickets.view", "tickets.manage", "tickets.reply"]),
    },
    {
      href: localePath(locale, "/dashboard/tickets/new"),
      label: dashboardT("newTicketLink"),
      active: currentPath === "/dashboard/tickets/new",
      visible: hasAnyPermission(user, ["tickets.create", "tickets.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/support"),
      label: dashboardT("supportLink"),
      active: currentPath === "/dashboard/support",
      visible: hasAnyPermission(user, [
        "tickets.view",
        "tickets.manage",
        "ticket_departments.view",
        "ticket_departments.manage",
        "support.access",
      ]),
    },
    {
      href: localePath(locale, "/dashboard/servers"),
      label: provisioningT("serversTitle"),
      active:
        currentPath === "/dashboard/servers" ||
        currentPath.startsWith("/dashboard/servers/"),
      visible: hasAnyPermission(user, ["servers.view", "servers.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/services"),
      label: provisioningT("servicesTitle"),
      active:
        currentPath === "/dashboard/services" ||
        (currentPath.startsWith("/dashboard/services/") &&
          currentPath !== "/dashboard/services/new"),
      visible: hasAnyPermission(user, ["services.view", "services.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/provisioning"),
      label: provisioningT("jobsTitle"),
      active: currentPath === "/dashboard/provisioning",
      visible: hasAnyPermission(user, ["provisioning.view", "provisioning.manage"]),
    },
  ];

  const portalNavigation: WorkspaceNavItem[] = [
    {
      href: localePath(locale, "/portal"),
      label: portalT("overviewLink"),
      active: currentPath === "/portal",
      visible: true,
    },
    {
      href: localePath(locale, "/portal/domains"),
      label: portalT("domainsLink"),
      active:
        currentPath === "/portal/domains" || currentPath.startsWith("/portal/domains/"),
      visible: hasAnyPermission(user, ["client.portal.access"]),
    },
    {
      href: localePath(locale, "/dashboard/services"),
      label: portalT("servicesLink"),
      active:
        currentPath === "/dashboard/services" ||
        currentPath.startsWith("/dashboard/services/"),
      visible: hasAnyPermission(user, ["services.view", "services.manage"]),
    },
    {
      href: localePath(locale, "/dashboard/invoices"),
      label: portalT("invoicesLink"),
      active:
        currentPath === "/dashboard/invoices" ||
        currentPath.startsWith("/dashboard/invoices/"),
      visible: hasAnyPermission(user, ["invoices.view", "invoices.manage"]),
    },
    {
      href: localePath(locale, "/portal/tickets"),
      label: portalT("ticketsLink"),
      active:
        currentPath === "/portal/tickets" ||
        currentPath.startsWith("/portal/tickets/"),
      visible: hasAnyPermission(user, ["tickets.view", "tickets.manage", "tickets.reply"]),
    },
    {
      href: localePath(locale, "/dashboard/provisioning"),
      label: portalT("provisioningLink"),
      active: currentPath === "/dashboard/provisioning",
      visible: hasAnyPermission(user, ["provisioning.view", "provisioning.manage"]),
    },
  ];

  const navigation = (mode === "portal" ? portalNavigation : adminNavigation).filter(
    (item) => item.visible,
  );

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
                {hasAdminWorkspace && mode !== "admin" ? (
                  <Link
                    href={localePath(locale, "/dashboard")}
                    className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                  >
                    {workspaceT("switchToAdmin")}
                  </Link>
                ) : null}
                {hasPortalWorkspace && mode !== "portal" ? (
                  <Link
                    href={localePath(locale, "/portal")}
                    className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                  >
                    {workspaceT("switchToPortal")}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
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

        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}

        {children}
      </div>
    </main>
  );
}
