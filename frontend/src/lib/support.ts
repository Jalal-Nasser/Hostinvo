import { apiBaseUrl, statefulApiHeaders } from "@/lib/auth";
import { type ClientRecord } from "@/lib/clients";

export const ticketPriorities = ["low", "medium", "high", "urgent"] as const;

export type TicketPriority = (typeof ticketPriorities)[number];
export type TicketApiMode = "admin" | "client";

export type TicketDepartmentRecord = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  tickets_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type TicketStatusRecord = {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  color: string | null;
  is_default: boolean;
  is_closed: boolean;
  display_order: number;
  tickets_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type TicketReplyRecord = {
  id: string;
  tenant_id: string;
  ticket_id: string;
  user_id: string | null;
  client_contact_id: string | null;
  reply_type: "client" | "admin" | "internal_note" | "system";
  is_internal: boolean;
  message: string;
  metadata?: Record<string, unknown> | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  client_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
};

export type TicketRecord = {
  id: string;
  tenant_id: string;
  department_id: string;
  status_id: string;
  client_id: string;
  client_contact_id: string | null;
  opened_by_user_id: string | null;
  assigned_to_user_id: string | null;
  service_id: string | null;
  ticket_number: string;
  subject: string;
  priority: TicketPriority;
  source: "portal" | "admin";
  last_reply_by: "client" | "admin" | "internal" | null;
  last_reply_at: string | null;
  last_client_reply_at: string | null;
  last_admin_reply_at: string | null;
  closed_at: string | null;
  metadata?: Record<string, unknown> | null;
  replies_count?: number;
  department?: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
  } | null;
  status?: {
    id: string;
    name: string;
    code: string;
    color: string | null;
    is_closed: boolean;
  } | null;
  client?: Pick<ClientRecord, "id" | "display_name" | "email" | "preferred_locale"> | null;
  client_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  opened_by?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assigned_to?: {
    id: string;
    name: string;
    email: string;
  } | null;
  service?: {
    id: string;
    reference_number: string;
    status: string;
    domain: string | null;
  } | null;
  replies?: TicketReplyRecord[];
  created_at: string | null;
  updated_at: string | null;
};

export type TicketFormPayload = {
  client_id?: string;
  department_id?: string | null;
  service_id?: string | null;
  subject: string;
  priority: TicketPriority;
  message: string;
  turnstile_token?: string;
};

export type TicketReplyPayload = {
  message: string;
  status_id?: string | null;
  is_internal?: boolean;
};

type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
};

export type TicketServiceRecord = {
  id: string;
  reference_number: string;
  status: string;
  domain: string | null;
  product?: {
    id: string;
    name: string;
  } | null;
};

type SupportOverviewResponse = {
  data: {
    stats: {
      total: number;
      open: number;
      closed: number;
      urgent: number;
      unassigned: number;
    };
    departments: TicketDepartmentRecord[];
    statuses: TicketStatusRecord[];
    recent_tickets: TicketRecord[];
  };
};

function endpoint(mode: TicketApiMode): string {
  return `${apiBaseUrl}/${mode}`;
}

export async function fetchTicketsFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status_id?: string;
    priority?: string;
    department_id?: string;
    page?: string;
    per_page?: string;
  } = {},
  mode: TicketApiMode = "admin",
): Promise<PaginatedResponse<TicketRecord> | null> {
  const url = new URL(`${endpoint(mode)}/tickets`);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, mode === "client" ? "/portal" : "/dashboard"),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PaginatedResponse<TicketRecord>;
}

export async function fetchTicketFromCookies(
  cookieHeader: string,
  ticketId: string,
  mode: TicketApiMode = "admin",
): Promise<TicketRecord | null> {
  const response = await fetch(`${endpoint(mode)}/tickets/${ticketId}`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, mode === "client" ? "/portal" : "/dashboard"),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: TicketRecord };

  return payload.data;
}

export async function fetchTicketDepartmentsFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    is_active?: string;
    page?: string;
    per_page?: string;
  } = {},
  mode: TicketApiMode = "admin",
): Promise<PaginatedResponse<TicketDepartmentRecord> | null> {
  const url = new URL(`${endpoint(mode)}/ticket-departments`);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, mode === "client" ? "/portal" : "/dashboard"),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PaginatedResponse<TicketDepartmentRecord>;
}

export async function fetchTicketStatusesFromCookies(
  cookieHeader: string,
  mode: TicketApiMode = "admin",
): Promise<TicketStatusRecord[] | null> {
  const response = await fetch(`${endpoint(mode)}/ticket-statuses`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, mode === "client" ? "/portal" : "/dashboard"),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: TicketStatusRecord[] };

  return payload.data;
}

export async function fetchSupportOverviewFromCookies(
  cookieHeader: string,
  mode: TicketApiMode = "admin",
): Promise<SupportOverviewResponse["data"] | null> {
  const response = await fetch(`${endpoint(mode)}/support/overview`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, mode === "client" ? "/portal" : "/dashboard"),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as SupportOverviewResponse;

  return payload.data;
}

export async function fetchTicketServicesFromCookies(
  cookieHeader: string,
): Promise<TicketServiceRecord[] | null> {
  const response = await fetch(`${endpoint("client")}/ticket-services`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, "/portal"),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: TicketServiceRecord[] };

  return payload.data;
}
