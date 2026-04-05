import { apiBaseUrl, statefulApiHeaders } from "@/lib/auth";
import { submitAdminJson } from "@/lib/tenant-admin";

export const tenantStatuses = ["active", "suspended"] as const;

export type TenantStatus = (typeof tenantStatuses)[number];

export type TenantLicenseSummary = {
  id: string;
  license_key: string;
  plan: string;
  status: string;
  domain: string | null;
  max_clients: number | null;
  max_services: number | null;
  issued_at: string | null;
  expires_at: string | null;
  last_verified_at: string | null;
  is_trial: boolean;
};

export type TenantOwnerRecord = {
  id: string;
  name: string;
  email: string;
  locale: string;
  is_active: boolean;
  last_login_at: string | null;
};

export type TenantRecord = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  owner_user_id: string | null;
  primary_domain: string | null;
  default_locale: string;
  default_currency: string;
  timezone: string;
  users_count?: number;
  owner?: TenantOwnerRecord | null;
  license_summary?: TenantLicenseSummary | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export type TenantFormPayload = {
  name: string;
  slug?: string | null;
  primary_domain: string;
  default_locale: string;
  default_currency: string;
  timezone: string;
  owner_name: string;
  owner_email: string;
  owner_password?: string | null;
  owner_password_confirmation?: string | null;
};

type PaginatedTenantResponse = {
  data: TenantRecord[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

type MutationResult<T> = {
  data: T | null;
  error: string | null;
  errors: Record<string, string[]> | null;
  status: number;
};

export async function fetchTenantsFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status?: string;
    plan?: string;
    per_page?: string;
    page?: string;
  } = {},
): Promise<PaginatedTenantResponse | null> {
  const url = new URL(`${apiBaseUrl}/admin/tenants`);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, "/dashboard/tenants"),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PaginatedTenantResponse;
}

export async function fetchTenantFromCookies(
  cookieHeader: string,
  tenantId: string,
): Promise<TenantRecord | null> {
  const response = await fetch(`${apiBaseUrl}/admin/tenants/${tenantId}`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, `/dashboard/tenants/${tenantId}`),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: TenantRecord };

  return payload.data;
}

export async function createTenant(
  payload: TenantFormPayload,
): Promise<MutationResult<TenantRecord>> {
  return submitAdminJson<TenantRecord>("tenants", "POST", payload);
}

export async function updateTenant(
  tenantId: string,
  payload: TenantFormPayload,
): Promise<MutationResult<TenantRecord>> {
  return submitAdminJson<TenantRecord>(`tenants/${tenantId}`, "PUT", payload);
}

export async function activateTenant(
  tenantId: string,
): Promise<MutationResult<TenantRecord>> {
  return submitAdminJson<TenantRecord>(`tenants/${tenantId}/activate`, "POST", {});
}

export async function suspendTenant(
  tenantId: string,
): Promise<MutationResult<TenantRecord>> {
  return submitAdminJson<TenantRecord>(`tenants/${tenantId}/suspend`, "POST", {});
}

export async function switchTenantContext(
  tenantId: string,
): Promise<
  MutationResult<{
    tenant: Pick<TenantRecord, "id" | "name" | "slug" | "status">;
  }>
> {
  return submitAdminJson<{ tenant: Pick<TenantRecord, "id" | "name" | "slug" | "status"> }>(
    `tenants/${tenantId}/switch`,
    "POST",
    {},
  );
}

export async function clearTenantContext(): Promise<
  MutationResult<{ cleared: boolean }>
> {
  return submitAdminJson<{ cleared: boolean }>("tenant-context/clear", "POST", {});
}

export async function impersonateTenantAdmin(
  tenantId: string,
): Promise<MutationResult<{ redirect: string }>> {
  return submitAdminJson<{ redirect: string }>(
    `tenants/${tenantId}/impersonate-admin`,
    "POST",
    {},
  );
}

export async function impersonateTenantPortal(
  tenantId: string,
): Promise<MutationResult<{ redirect: string }>> {
  return submitAdminJson<{ redirect: string }>(
    `tenants/${tenantId}/impersonate-portal`,
    "POST",
    {},
  );
}

export async function stopImpersonation(): Promise<MutationResult<{ redirect: string }>> {
  return submitAdminJson<{ redirect: string }>("impersonation/stop", "POST", {});
}
