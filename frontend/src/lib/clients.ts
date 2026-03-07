import { apiBaseUrl } from "@/lib/auth";

export const clientStatuses = ["active", "inactive", "lead"] as const;
export const clientTypes = ["company", "individual"] as const;
export const addressTypes = ["billing", "mailing", "service"] as const;

export type ClientStatus = (typeof clientStatuses)[number];
export type ClientType = (typeof clientTypes)[number];
export type AddressType = (typeof addressTypes)[number];

export type ClientContact = {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  job_title?: string | null;
  is_primary: boolean;
};

export type ClientAddress = {
  id?: string;
  type: AddressType;
  line_1: string;
  line_2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  is_primary: boolean;
};

export type ClientRecord = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  client_type: ClientType;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string;
  phone: string | null;
  country: string;
  status: ClientStatus;
  preferred_locale: string;
  currency: string;
  notes: string | null;
  contacts_count?: number;
  addresses_count?: number;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  contacts?: ClientContact[];
  addresses?: ClientAddress[];
  activity_logs?: Array<{
    id: string;
    action: string;
    description: string;
    metadata?: Record<string, unknown> | null;
    created_at: string;
    user?: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
  created_at: string;
  updated_at: string;
};

export type ClientFormPayload = {
  client_type: ClientType;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  email: string;
  phone?: string | null;
  country: string;
  status: ClientStatus;
  preferred_locale: string;
  currency: string;
  notes?: string | null;
  contacts?: ClientContact[];
  addresses?: ClientAddress[];
};

type PaginatedClientResponse = {
  data: ClientRecord[];
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

export async function fetchClientsFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status?: string;
    page?: string;
  } = {},
): Promise<PaginatedClientResponse | null> {
  const url = new URL(`${apiBaseUrl}/admin/clients`);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PaginatedClientResponse;
}

export async function fetchClientFromCookies(
  cookieHeader: string,
  clientId: string,
): Promise<ClientRecord | null> {
  const response = await fetch(`${apiBaseUrl}/admin/clients/${clientId}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: ClientRecord };

  return payload.data;
}
