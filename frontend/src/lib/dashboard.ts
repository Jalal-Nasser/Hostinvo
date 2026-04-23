import {
  apiBaseUrl,
  hasAnyPermission,
  statefulApiHeaders,
  type AuthenticatedUser,
} from "@/lib/auth";
import { fetchInvoicesFromCookies, type InvoiceRecord } from "@/lib/billing";
import { fetchClientsFromCookies, type ClientRecord } from "@/lib/clients";
import {
  fetchProvisioningJobsFromCookies,
  fetchServicesFromCookies,
  type ProvisioningJobRecord,
  type ServiceRecord,
} from "@/lib/provisioning";
import {
  fetchSupportOverviewFromCookies,
  fetchTicketsFromCookies,
  type TicketRecord,
} from "@/lib/support";

export type AdminDashboardSummary = {
  modules: {
    clients: {
      accessible: boolean;
      total: number | null;
      recent: ClientRecord[];
    };
    services: {
      accessible: boolean;
      total: number | null;
      active: number | null;
      recent: ServiceRecord[];
    };
    invoices: {
      accessible: boolean;
      total: number | null;
      overdue: number | null;
      recent: InvoiceRecord[];
    };
    tickets: {
      accessible: boolean;
      total: number | null;
      open: number | null;
      urgent: number | null;
      recent: TicketRecord[];
    };
    provisioning: {
      accessible: boolean;
      queued: number | null;
      failed: number | null;
      recent: ProvisioningJobRecord[];
    };
  };
};

export type TenantDashboardChartPoint = {
  bucket: string;
  label: string;
  new_orders: number;
  activated_orders: number;
  income_minor: number;
};

export type TenantDashboardOverview = {
  tenant: {
    id: string;
    name: string;
    timezone: string;
    currency: string;
  };
  counters: {
    pending_orders: number;
    tickets_waiting: number;
    pending_cancellations: number;
    pending_module_actions: number;
  };
  billing: {
    currency: string;
    today_minor: number;
    this_month_minor: number;
    this_year_minor: number;
    all_time_minor: number;
  };
  automation: {
    invoices_created_today: number;
    credit_card_captures_today: number;
  };
  chart: {
    default_period: "today" | "last_30_days" | "last_year";
    series: Record<"today" | "last_30_days" | "last_year", TenantDashboardChartPoint[]>;
  };
};

export type PortalDashboardSummary = {
  modules: {
    services: { accessible: boolean; total: number | null };
    invoices: { accessible: boolean; total: number | null };
    tickets: { accessible: boolean; total: number | null };
    provisioning: { accessible: boolean; total: number | null };
  };
  ticket_health: {
    open: number | null;
    urgent: number | null;
  };
  recent_tickets: TicketRecord[];
};

export async function fetchTenantDashboardOverviewFromCookies(
  cookieHeader: string,
): Promise<TenantDashboardOverview | null> {
  const response = await fetch(`${apiBaseUrl}/admin/dashboard/overview`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: TenantDashboardOverview };

  return payload.data;
}

export async function fetchAdminDashboardSummary(
  cookieHeader: string,
  user: AuthenticatedUser,
): Promise<AdminDashboardSummary> {
  const canViewClients = hasAnyPermission(user, ["clients.view", "clients.manage"]);
  const canViewServices = hasAnyPermission(user, ["services.view", "services.manage"]);
  const canViewInvoices = hasAnyPermission(user, ["invoices.view", "invoices.manage"]);
  const canViewTickets = hasAnyPermission(user, ["tickets.view", "tickets.manage", "tickets.reply"]);
  const canViewProvisioning = hasAnyPermission(user, ["provisioning.view", "provisioning.manage"]);

  const [
    clients,
    services,
    activeServices,
    invoices,
    overdueInvoices,
    tickets,
    supportOverview,
    queuedJobs,
    failedJobs,
    recentJobs,
  ] = await Promise.all([
    canViewClients ? fetchClientsFromCookies(cookieHeader, { per_page: "4" }) : Promise.resolve(null),
    canViewServices ? fetchServicesFromCookies(cookieHeader, { per_page: "4" }) : Promise.resolve(null),
    canViewServices
      ? fetchServicesFromCookies(cookieHeader, { per_page: "1", status: "active" })
      : Promise.resolve(null),
    canViewInvoices ? fetchInvoicesFromCookies(cookieHeader, { per_page: "4" }) : Promise.resolve(null),
    canViewInvoices
      ? fetchInvoicesFromCookies(cookieHeader, { per_page: "1", status: "overdue" })
      : Promise.resolve(null),
    canViewTickets ? fetchTicketsFromCookies(cookieHeader, { per_page: "4" }) : Promise.resolve(null),
    canViewTickets ? fetchSupportOverviewFromCookies(cookieHeader) : Promise.resolve(null),
    canViewProvisioning
      ? fetchProvisioningJobsFromCookies(cookieHeader, { per_page: "1", status: "queued" })
      : Promise.resolve(null),
    canViewProvisioning
      ? fetchProvisioningJobsFromCookies(cookieHeader, { per_page: "1", status: "failed" })
      : Promise.resolve(null),
    canViewProvisioning
      ? fetchProvisioningJobsFromCookies(cookieHeader, { per_page: "4" })
      : Promise.resolve(null),
  ]);

  return {
    modules: {
      clients: {
        accessible: canViewClients,
        total: canViewClients ? clients?.meta?.total ?? 0 : null,
        recent: canViewClients ? clients?.data ?? [] : [],
      },
      services: {
        accessible: canViewServices,
        total: canViewServices ? services?.meta?.total ?? 0 : null,
        active: canViewServices ? activeServices?.meta?.total ?? 0 : null,
        recent: canViewServices ? services?.data ?? [] : [],
      },
      invoices: {
        accessible: canViewInvoices,
        total: canViewInvoices ? invoices?.meta?.total ?? 0 : null,
        overdue: canViewInvoices ? overdueInvoices?.meta?.total ?? 0 : null,
        recent: canViewInvoices ? invoices?.data ?? [] : [],
      },
      tickets: {
        accessible: canViewTickets,
        total: canViewTickets ? supportOverview?.stats.total ?? tickets?.meta?.total ?? 0 : null,
        open: canViewTickets ? supportOverview?.stats.open ?? 0 : null,
        urgent: canViewTickets ? supportOverview?.stats.urgent ?? 0 : null,
        recent: canViewTickets ? supportOverview?.recent_tickets ?? tickets?.data ?? [] : [],
      },
      provisioning: {
        accessible: canViewProvisioning,
        queued: canViewProvisioning ? queuedJobs?.meta?.total ?? 0 : null,
        failed: canViewProvisioning ? failedJobs?.meta?.total ?? 0 : null,
        recent: canViewProvisioning ? recentJobs?.data ?? [] : [],
      },
    },
  };
}

export async function fetchPortalDashboardSummary(
  cookieHeader: string,
  user: AuthenticatedUser,
): Promise<PortalDashboardSummary> {
  const canViewServices = hasAnyPermission(user, ["services.view", "services.manage"]);
  const canViewInvoices = hasAnyPermission(user, ["invoices.view", "invoices.manage"]);
  const canViewTickets = hasAnyPermission(user, ["tickets.view", "tickets.manage", "tickets.reply"]);
  const canViewProvisioning = hasAnyPermission(user, ["provisioning.view", "provisioning.manage"]);

  const [services, invoices, tickets, supportOverview, provisioning] = await Promise.all([
    canViewServices ? fetchServicesFromCookies(cookieHeader, { per_page: "1" }) : Promise.resolve(null),
    canViewInvoices ? fetchInvoicesFromCookies(cookieHeader, { per_page: "1" }) : Promise.resolve(null),
    canViewTickets ? fetchTicketsFromCookies(cookieHeader, { per_page: "4" }, "client") : Promise.resolve(null),
    canViewTickets ? fetchSupportOverviewFromCookies(cookieHeader, "client") : Promise.resolve(null),
    canViewProvisioning
      ? fetchProvisioningJobsFromCookies(cookieHeader, { per_page: "1", status: "queued" })
      : Promise.resolve(null),
  ]);

  return {
    modules: {
      services: {
        accessible: canViewServices,
        total: canViewServices ? services?.meta?.total ?? 0 : null,
      },
      invoices: {
        accessible: canViewInvoices,
        total: canViewInvoices ? invoices?.meta?.total ?? 0 : null,
      },
      tickets: {
        accessible: canViewTickets,
        total: canViewTickets ? supportOverview?.stats.total ?? tickets?.meta?.total ?? 0 : null,
      },
      provisioning: {
        accessible: canViewProvisioning,
        total: canViewProvisioning ? provisioning?.meta?.total ?? 0 : null,
      },
    },
    ticket_health: {
      open: canViewTickets ? supportOverview?.stats.open ?? 0 : null,
      urgent: canViewTickets ? supportOverview?.stats.urgent ?? 0 : null,
    },
    recent_tickets: canViewTickets ? supportOverview?.recent_tickets ?? tickets?.data ?? [] : [],
  };
}
