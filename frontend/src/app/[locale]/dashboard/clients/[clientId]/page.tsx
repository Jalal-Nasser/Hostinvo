import Link from "next/link";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { formatMinorCurrency, type InvoiceRecord } from "@/lib/billing";
import { fetchClientFromCookies } from "@/lib/clients";
import { type ServiceRecord } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export default async function ClientDetailsPage({
  params,
}: Readonly<{
  params: { locale: string; clientId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Clients");
  const client = await fetchClientFromCookies(cookies().toString(), params.clientId);

  if (!client) {
    notFound();
  }

  const services = client.services ?? [];
  const invoices = client.invoices ?? [];
  const activeServices = services.filter((service) => service.status === "active");
  const suspendedServices = services.filter((service) => service.status === "suspended");
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const unpaidInvoices = invoices.filter((invoice) => ["unpaid", "overdue"].includes(invoice.status));
  const draftInvoices = invoices.filter((invoice) => invoice.status === "draft");
  const cancelledInvoices = invoices.filter((invoice) => invoice.status === "cancelled");
  const refundedInvoices = invoices.filter((invoice) => invoice.status === "refunded");
  const invoiceCurrency = invoices[0]?.currency ?? client.currency;
  const invoiceTotal = invoices.reduce((total, invoice) => total + invoice.total_minor, 0);
  const invoiceBalance = invoices.reduce((total, invoice) => total + invoice.balance_due_minor, 0);
  const gravatarUrl = getGravatarUrl(client.email);

  return (
    <DashboardShell
      actions={
        <Link
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          href={localePath(params.locale, `/dashboard/clients/${client.id}/edit`)}
        >
          {t("editClientButton")}
        </Link>
      }
      currentPath={`/dashboard/clients/${client.id}`}
      description={t("detailsDescription")}
      locale={params.locale as AppLocale}
      title={`#${client.id.slice(0, 8).toUpperCase()} - ${client.display_name}`}
    >
      <div className="client-profile-page">
        <div className="client-profile-header">
          <nav className="client-profile-tabs" aria-label="Client profile sections">
            <span aria-current="page">Summary</span>
            <Link href={localePath(params.locale, `/dashboard/clients/${client.id}/edit`)}>Profile</Link>
            <a href="#client-contacts">{t("contactsSection")}</a>
            <a href="#client-services">{t("servicesSection")}</a>
            <a href="#client-invoices">{t("invoicesSection")}</a>
            <a href="#client-activity">{t("activitySection")}</a>
          </nav>

          <div className="client-profile-strip">
            <div className="client-profile-avatar-block">
              <span
                aria-label={`${client.display_name} Gravatar`}
                className="client-profile-avatar"
                role="img"
                style={{ backgroundImage: `url("${gravatarUrl}")` }}
              />
              <span>
                <strong>{client.display_name}</strong>
                <small>{client.email}</small>
              </span>
            </div>
            <span>
              {t("statusLabel")}: <strong>{clientStatusLabel(client.status, t)}</strong>
            </span>
            <span>
              {t("portalAccessTitle")}:{" "}
              <strong>{client.owner ? t("portalAccessEnabledLabel") : t("portalAccessDisabledLabel")}</strong>
            </span>
            <span>
              {t("currencyLabel")}: <strong>{client.currency}</strong>
            </span>
            <span>
              {t("createdAtLabel")}: <strong>{formatDate(client.created_at, params.locale)}</strong>
            </span>
          </div>
        </div>

        {client.owner && !client.owner.email_verified_at ? (
          <div className="client-profile-alert">
            The owner account has not verified the email address.
          </div>
        ) : null}

        <section className="client-profile-grid">
          <article className="client-profile-card">
            <h2>Client Information</h2>
            <ProfileRows
              rows={[
                [t("firstNameLabel"), client.first_name ?? t("notAvailable")],
                [t("lastNameLabel"), client.last_name ?? t("notAvailable")],
                [t("companyNameLabel"), client.company_name ?? t("notAvailable")],
                [t("emailLabel"), client.email],
                [t("phoneLabel"), client.phone ?? t("notAvailable")],
                [t("countryLabel"), client.country],
                [t("typeLabel"), t(client.client_type === "company" ? "typeCompany" : "typeIndividual")],
                [t("statusLabel"), clientStatusLabel(client.status, t)],
              ]}
            />
          </article>

          <article className="client-profile-card">
            <h2>Invoices/Billing</h2>
            <ProfileRows
              rows={[
                ["Paid", `${paidInvoices.length} (${formatMinorCurrency(sumInvoices(paidInvoices), invoiceCurrency, params.locale)})`],
                ["Draft", `${draftInvoices.length} (${formatMinorCurrency(sumInvoices(draftInvoices), invoiceCurrency, params.locale)})`],
                ["Unpaid/Due", `${unpaidInvoices.length} (${formatMinorCurrency(sumInvoices(unpaidInvoices), invoiceCurrency, params.locale)})`],
                ["Cancelled", `${cancelledInvoices.length} (${formatMinorCurrency(sumInvoices(cancelledInvoices), invoiceCurrency, params.locale)})`],
                ["Refunded", `${refundedInvoices.length} (${formatMinorCurrency(sumInvoices(refundedInvoices), invoiceCurrency, params.locale)})`],
                ["Gross Revenue", formatMinorCurrency(invoiceTotal, invoiceCurrency, params.locale)],
                ["Balance Due", formatMinorCurrency(invoiceBalance, invoiceCurrency, params.locale)],
              ]}
            />
            <div className="client-profile-links">
              <Link href={localePath(params.locale, "/dashboard/invoices/new")}>Create invoice</Link>
              <Link href={localePath(params.locale, "/dashboard/invoices")}>View invoices</Link>
            </div>
          </article>

          <article className="client-profile-card">
            <h2>Products/Services</h2>
            <ProfileRows
              rows={[
                ["Hosting services", `${services.length} (${services.length} total)`],
                ["Active services", `${activeServices.length} (${services.length} total)`],
                ["Suspended services", `${suspendedServices.length} (${services.length} total)`],
                ["Domains", `${services.filter((service) => service.domain).length} (${services.length} total)`],
                ["Products", `${new Set(services.map((service) => service.product?.id).filter(Boolean)).size}`],
              ]}
            />
            <div className="client-profile-links">
              <Link href={localePath(params.locale, "/dashboard/orders")}>View orders</Link>
              <Link href={localePath(params.locale, "/dashboard/services/new")}>Add service</Link>
            </div>
          </article>

          <aside className="client-profile-card">
            <h2>Other Actions</h2>
            <div className="client-profile-actions">
              <Link href={localePath(params.locale, `/dashboard/clients/${client.id}/edit`)}>Edit profile</Link>
              <Link href={localePath(params.locale, "/dashboard/tickets/new")}>Open support ticket</Link>
              <Link href={localePath(params.locale, "/dashboard/orders/new")}>Create order</Link>
              <Link href={localePath(params.locale, "/dashboard/invoices/new")}>Create invoice</Link>
            </div>
          </aside>

          <article id="client-contacts" className="client-profile-card">
            <h2>{t("contactsSection")}</h2>
            {client.contacts && client.contacts.length > 0 ? (
              <ProfileRows
                rows={client.contacts.map((contact) => [
                  `${contact.first_name} ${contact.last_name}`,
                  `${contact.email}${contact.is_primary ? " - Primary" : ""}`,
                ])}
              />
            ) : (
              <p className="client-profile-empty">{t("noContacts")}</p>
            )}
          </article>

          <article className="client-profile-card">
            <h2>{t("addressesSection")}</h2>
            {client.addresses && client.addresses.length > 0 ? (
              <ProfileRows
                rows={client.addresses.map((address) => [
                  titleCase(address.type),
                  `${address.line_1}, ${address.city}${address.state ? `, ${address.state}` : ""}`,
                ])}
              />
            ) : (
              <p className="client-profile-empty">{t("noAddresses")}</p>
            )}
          </article>

          <article className="client-profile-card">
            <h2>Other Information</h2>
            <ProfileRows
              rows={[
                [t("localeLabel"), client.preferred_locale],
                [t("currencyLabel"), client.currency],
                [t("ownerLabel"), client.owner?.name ?? t("notAvailable")],
                ["Owner email verified", client.owner?.email_verified_at ? "Yes" : "No"],
                [t("createdAtLabel"), formatDateTime(client.created_at, params.locale)],
              ]}
            />
          </article>

          <article className="client-profile-card">
            <h2>{t("notesLabel")}</h2>
            <p className="client-profile-note">{client.notes || t("notAvailable")}</p>
          </article>
        </section>

        <section id="client-services" className="client-profile-table-section">
          <h2>{t("servicesSection")}</h2>
          <div className="client-table-wrap">
            <table className="client-table client-profile-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product/Service</th>
                  <th>Amount</th>
                  <th>Billing Cycle</th>
                  <th>Signup Date</th>
                  <th>Next Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {services.length > 0 ? (
                  services.map((service, index) => (
                    <tr key={service.id}>
                      <td>{index + 1}</td>
                      <td>
                        <Link className="client-email-link" href={localePath(params.locale, `/dashboard/services/${service.id}`)}>
                          {service.product?.name ?? service.reference_number}
                        </Link>
                        {service.domain ? <span className="client-profile-subline">{service.domain}</span> : null}
                      </td>
                      <td>{formatServiceAmount(service, params.locale)}</td>
                      <td>{titleCase(service.billing_cycle)}</td>
                      <td>{formatOptionalDate(service.registration_date, params.locale)}</td>
                      <td>{formatOptionalDate(service.next_due_date, params.locale)}</td>
                      <td>{titleCase(service.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center">{t("noServices")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="client-invoices" className="client-profile-table-section">
          <h2>{t("invoicesSection")}</h2>
          <div className="client-table-wrap">
            <table className="client-table client-profile-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map((invoice, index) => (
                    <tr key={invoice.id}>
                      <td>{index + 1}</td>
                      <td>
                        <Link className="client-email-link" href={localePath(params.locale, `/dashboard/invoices/${invoice.id}`)}>
                          {invoice.reference_number}
                        </Link>
                      </td>
                      <td>{formatOptionalDate(invoice.issue_date, params.locale)}</td>
                      <td>{formatOptionalDate(invoice.due_date, params.locale)}</td>
                      <td>{formatMinorCurrency(invoice.total_minor, invoice.currency, params.locale)}</td>
                      <td>{formatMinorCurrency(invoice.balance_due_minor, invoice.currency, params.locale)}</td>
                      <td>{titleCase(invoice.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center">{t("noInvoices")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="client-activity" className="client-profile-table-section">
          <h2>{t("activitySection")}</h2>
          <div className="client-table-wrap">
            <table className="client-table client-profile-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Description</th>
                  <th>User</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {client.activity_logs && client.activity_logs.length > 0 ? (
                  client.activity_logs.map((activity) => (
                    <tr key={activity.id}>
                      <td>{titleCase(activity.action)}</td>
                      <td>{activity.description}</td>
                      <td>{activity.user?.name ?? t("systemActor")}</td>
                      <td>{formatDateTime(activity.created_at, params.locale)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center">{t("noActivity")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function ProfileRows({ rows }: Readonly<{ rows: Array<[string, string]> }>) {
  return (
    <dl className="client-profile-rows">
      {rows.map(([label, value]) => (
        <div key={`${label}-${value}`}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function clientStatusLabel(status: string, t: Awaited<ReturnType<typeof getTranslations<"Clients">>>) {
  if (status === "active") {
    return t("statusActive");
  }

  if (status === "inactive") {
    return t("statusInactive");
  }

  return t("statusLead");
}

function sumInvoices(invoices: InvoiceRecord[]) {
  return invoices.reduce((total, invoice) => total + invoice.total_minor, 0);
}

function formatServiceAmount(service: ServiceRecord, locale: string) {
  return new Intl.NumberFormat(locale, {
    currency: service.currency,
    style: "currency",
  }).format(service.price);
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatOptionalDate(value: string | null, locale: string) {
  return value ? formatDate(value, locale) : "-";
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getGravatarUrl(email: string) {
  const hash = createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  const params = new URLSearchParams({
    d: "identicon",
    r: "g",
    s: "96",
  });

  return `https://www.gravatar.com/avatar/${hash}?${params.toString()}`;
}
