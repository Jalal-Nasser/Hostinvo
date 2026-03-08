import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";

type DashboardShellProps = {
  locale: AppLocale;
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export async function DashboardShell({
  locale,
  currentPath,
  title,
  description,
  children,
  actions,
}: DashboardShellProps) {
  const t = await getTranslations("Dashboard");

  const navigation = [
    {
      href: localePath(locale, "/dashboard"),
      label: t("overviewLink"),
      active: currentPath === "/dashboard",
    },
    {
      href: localePath(locale, "/dashboard/clients"),
      label: t("clientsLink"),
      active:
        currentPath === "/dashboard/clients" ||
        (currentPath.startsWith("/dashboard/clients/") &&
          currentPath !== "/dashboard/clients/new"),
    },
    {
      href: localePath(locale, "/dashboard/clients/new"),
      label: t("newClientLink"),
      active: currentPath === "/dashboard/clients/new",
    },
    {
      href: localePath(locale, "/dashboard/product-groups"),
      label: t("productGroupsLink"),
      active: currentPath === "/dashboard/product-groups",
    },
    {
      href: localePath(locale, "/dashboard/products"),
      label: t("productsLink"),
      active:
        currentPath === "/dashboard/products" ||
        (currentPath.startsWith("/dashboard/products/") &&
          currentPath !== "/dashboard/products/new"),
    },
    {
      href: localePath(locale, "/dashboard/products/new"),
      label: t("newProductLink"),
      active: currentPath === "/dashboard/products/new",
    },
    {
      href: localePath(locale, "/dashboard/orders"),
      label: t("ordersLink"),
      active:
        currentPath === "/dashboard/orders" ||
        (currentPath.startsWith("/dashboard/orders/") &&
          currentPath !== "/dashboard/orders/new" &&
          currentPath !== "/dashboard/orders/checkout-review"),
    },
    {
      href: localePath(locale, "/dashboard/orders/new"),
      label: t("newOrderLink"),
      active:
        currentPath === "/dashboard/orders/new" ||
        currentPath === "/dashboard/orders/checkout-review",
    },
    {
      href: localePath(locale, "/dashboard/invoices"),
      label: t("invoicesLink"),
      active:
        currentPath === "/dashboard/invoices" ||
        (currentPath.startsWith("/dashboard/invoices/") &&
          currentPath !== "/dashboard/invoices/new"),
    },
    {
      href: localePath(locale, "/dashboard/invoices/new"),
      label: t("newInvoiceLink"),
      active: currentPath === "/dashboard/invoices/new",
    },
    {
      href: localePath(locale, "/dashboard/payments"),
      label: t("paymentsLink"),
      active: currentPath === "/dashboard/payments",
    },
  ];

  return (
    <main className="min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="glass-card p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-[0.3em] text-accent">
                Hostinvo
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-foreground">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{description}</p>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <LocaleSwitcher currentLocale={locale} path={currentPath} />
              <LogoutButton />
            </div>
          </div>
        </header>

        <nav className="flex flex-wrap gap-3">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                item.active
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-white/75 text-foreground hover:bg-accentSoft",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}

        {children}
      </div>
    </main>
  );
}
