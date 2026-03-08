import { apiBaseUrl } from "@/lib/auth";
import { type ClientRecord } from "@/lib/clients";
import { type ServiceRecord } from "@/lib/provisioning";

export const domainStatuses = [
  "active",
  "expired",
  "pending_transfer",
  "pending_delete",
  "cancelled",
] as const;

export const domainContactTypes = [
  "registrant",
  "admin",
  "tech",
  "billing",
] as const;

export const domainRenewalStatuses = ["pending", "completed", "failed"] as const;

export type DomainStatus = (typeof domainStatuses)[number];
export type DomainContactType = (typeof domainContactTypes)[number];
export type DomainRenewalStatus = (typeof domainRenewalStatuses)[number];
export type DomainApiMode = "admin" | "client";

export type DomainContactRecord = {
  id: number;
  tenant_id: string;
  domain_id: string;
  type: DomainContactType;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: {
    line1: string;
    city: string;
    state?: string | null;
    postal_code?: string | null;
    country: string;
  };
  created_at: string | null;
  updated_at: string | null;
};

export type DomainRenewalRecord = {
  id: number;
  tenant_id: string;
  domain_id: string;
  years: number;
  price: number;
  status: DomainRenewalStatus;
  renewed_at: string | null;
  created_at: string | null;
};

export type RegistrarLogRecord = {
  id: number;
  tenant_id: string;
  domain_id: string;
  operation: string;
  status: "success" | "failed";
  request_payload?: Record<string, unknown> | null;
  response_payload?: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string | null;
};

export type DomainRecord = {
  id: string;
  tenant_id: string;
  client_id: string;
  service_id: string | null;
  domain: string;
  tld: string;
  status: DomainStatus;
  registrar: string | null;
  registration_date: string | null;
  expiry_date: string | null;
  auto_renew: boolean;
  dns_management: boolean;
  id_protection: boolean;
  renewal_price: number | null;
  currency: string;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
  contacts_count?: number;
  renewals_count?: number;
  client?: Pick<ClientRecord, "id" | "display_name" | "email" | "preferred_locale"> | null;
  service?: Pick<ServiceRecord, "id" | "reference_number" | "status" | "domain"> | null;
  contacts?: DomainContactRecord[];
  renewals?: DomainRenewalRecord[];
  registrar_logs?: RegistrarLogRecord[];
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export type DomainFormPayload = {
  client_id: string;
  service_id?: string | null;
  domain: string;
  tld: string;
  status: DomainStatus;
  registrar?: string | null;
  registration_date?: string | null;
  expiry_date: string;
  auto_renew: boolean;
  dns_management: boolean;
  id_protection: boolean;
  renewal_price?: number | null;
  currency: string;
  notes?: string | null;
};

export type DomainContactPayload = {
  id?: number;
  type: DomainContactType;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address: {
    line1: string;
    city: string;
    state?: string | null;
    postal_code?: string | null;
    country: string;
  };
};

type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

function endpoint(mode: DomainApiMode): string {
  return `${apiBaseUrl}/${mode}`;
}

export async function fetchDomainsFromCookies(
  cookieHeader: string,
  mode: DomainApiMode,
  filters: {
    search?: string;
    status?: string;
    client_id?: string;
    registrar?: string;
    page?: string;
    per_page?: string;
  } = {},
): Promise<PaginatedResponse<DomainRecord> | null> {
  const url = new URL(`${endpoint(mode)}/domains`);

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

  return (await response.json()) as PaginatedResponse<DomainRecord>;
}

export async function fetchDomainFromCookies(
  cookieHeader: string,
  domainId: string,
  mode: DomainApiMode,
): Promise<DomainRecord | null> {
  const response = await fetch(`${endpoint(mode)}/domains/${domainId}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: DomainRecord };

  return payload.data;
}

export async function fetchDomainContactsFromCookies(
  cookieHeader: string,
  domainId: string,
  mode: DomainApiMode,
): Promise<DomainContactRecord[] | null> {
  const response = await fetch(`${endpoint(mode)}/domains/${domainId}/contacts`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: DomainContactRecord[] };

  return payload.data;
}

export async function fetchDomainRenewalsFromCookies(
  cookieHeader: string,
  domainId: string,
  mode: DomainApiMode,
): Promise<DomainRenewalRecord[] | null> {
  const response = await fetch(`${endpoint(mode)}/domains/${domainId}/renewals`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: DomainRenewalRecord[] };

  return payload.data;
}

export async function fetchRegistrarLogsFromCookies(
  cookieHeader: string,
  domainId: string,
): Promise<RegistrarLogRecord[] | null> {
  const response = await fetch(`${endpoint("admin")}/domains/${domainId}/registrar-logs`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: RegistrarLogRecord[] };

  return payload.data;
}
