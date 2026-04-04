import { apiBaseUrl, statefulApiHeaders } from "@/lib/auth";
import { type BillingCycle } from "@/lib/catalog";

export const serviceStatuses = [
  "pending",
  "provisioning",
  "active",
  "suspended",
  "terminated",
  "failed",
] as const;

export const provisioningStates = [
  "idle",
  "queued",
  "processing",
  "placeholder",
  "synced",
  "failed",
] as const;

export const serverStatuses = ["active", "inactive", "maintenance"] as const;
export const serverPanelTypes = ["cpanel", "plesk"] as const;
export const provisioningOperations = [
  "create_account",
  "suspend_account",
  "unsuspend_account",
  "terminate_account",
  "change_package",
  "reset_password",
  "sync_usage",
  "sync_service_status",
] as const;

export type ServiceStatus = (typeof serviceStatuses)[number];
export type ProvisioningState = (typeof provisioningStates)[number];
export type ServerStatus = (typeof serverStatuses)[number];
export type ServerPanelType = (typeof serverPanelTypes)[number];
export type ProvisioningOperation = (typeof provisioningOperations)[number];
export type ServiceApiMode = "admin" | "client";

export type ProvisioningLogRecord = {
  id: string;
  tenant_id: string;
  provisioning_job_id: string | null;
  service_id: string | null;
  server_id: string | null;
  operation: string;
  status: string;
  driver: string | null;
  message: string;
  request_payload?: Record<string, unknown> | null;
  response_payload?: Record<string, unknown> | null;
  occurred_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProvisioningJobRecord = {
  id: string;
  tenant_id: string;
  service_id: string;
  server_id: string | null;
  requested_by_user_id: string | null;
  operation: ProvisioningOperation;
  status: "queued" | "processing" | "completed" | "failed";
  driver: string | null;
  queue_name: string | null;
  attempts: number;
  payload?: Record<string, unknown> | null;
  result_payload?: Record<string, unknown> | null;
  error_message: string | null;
  requested_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  service?: {
    id: string;
    reference_number: string;
    status: ServiceStatus;
    provisioning_state: ProvisioningState;
    domain: string | null;
  } | null;
  server?: {
    id: string;
    name: string;
    hostname: string;
    panel_type: ServerPanelType;
  } | null;
  requested_by?: {
    id: string;
    name: string;
    email: string;
  } | null;
  logs?: ProvisioningLogRecord[];
  created_at: string;
  updated_at: string;
};

export type ServerRecord = {
  id: string;
  tenant_id: string;
  server_group_id: string | null;
  name: string;
  hostname: string;
  panel_type: ServerPanelType;
  api_endpoint: string | null;
  api_port: number | null;
  status: ServerStatus;
  verify_ssl: boolean;
  max_accounts: number | null;
  current_accounts: number;
  username: string | null;
  has_credentials: boolean;
  last_tested_at: string | null;
  notes: string | null;
  packages_count?: number;
  services_count?: number;
  group?: {
    id: string;
    name: string;
    status: string;
  } | null;
  packages?: Array<{
    id: string;
    product_id: string;
    panel_package_name: string;
    display_name: string | null;
    is_default: boolean;
    metadata?: Record<string, unknown> | null;
    product?: {
      id: string;
      name: string;
      slug: string;
      type: string;
    } | null;
  }>;
  services?: Array<{
    id: string;
    reference_number: string;
    status: ServiceStatus;
    provisioning_state: ProvisioningState;
    domain: string | null;
  }>;
  provisioning_jobs?: ProvisioningJobRecord[];
  provisioning_logs?: ProvisioningLogRecord[];
  created_at: string;
  updated_at: string;
};

export type ServerConnectionTestRecord = {
  driver: string;
  label: string;
  successful: boolean;
  message: string;
  version?: string | null;
  tested_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ServiceRecord = {
  id: string;
  tenant_id: string;
  client_id: string;
  product_id: string;
  order_id: string | null;
  user_id: string | null;
  server_id: string | null;
  server_package_id: string | null;
  reference_number: string;
  service_type: "hosting";
  status: ServiceStatus;
  provisioning_state: ProvisioningState;
  billing_cycle: BillingCycle;
  price: number;
  currency: string;
  domain: string | null;
  username: string | null;
  external_reference: string | null;
  last_operation: string | null;
  registration_date: string | null;
  next_due_date: string | null;
  termination_date: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  terminated_at: string | null;
  last_synced_at: string | null;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
  provisioning_jobs_count?: number;
  client?: {
    id: string;
    display_name: string;
    email: string;
  } | null;
  product?: {
    id: string;
    name: string;
    type: string;
  } | null;
  order?: {
    id: string;
    reference_number: string;
    status: string;
  } | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  server?: {
    id: string;
    name: string;
    hostname: string;
    panel_type: ServerPanelType;
    status: ServerStatus;
  } | null;
  server_package?: {
    id: string;
    panel_package_name: string;
    display_name: string | null;
  } | null;
  credentials?: {
    id: string;
    has_credentials: boolean;
    control_panel_url: string | null;
    access_url: string | null;
    metadata?: Record<string, unknown> | null;
  } | null;
  usage?: {
    disk_used_mb: number;
    disk_limit_mb: number;
    bandwidth_used_mb: number;
    bandwidth_limit_mb: number;
    email_accounts_used: number;
    databases_used: number;
    last_synced_at: string | null;
  } | null;
  suspensions?: Array<{
    id: string;
    reason: string | null;
    suspended_at: string | null;
    unsuspended_at: string | null;
  }>;
  provisioning_jobs?: ProvisioningJobRecord[];
  provisioning_logs?: ProvisioningLogRecord[];
  created_at: string;
  updated_at: string;
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

function endpoint(mode: ServiceApiMode): string {
  return `${apiBaseUrl}/${mode}`;
}

export async function fetchServicesFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status?: string;
    provisioning_state?: string;
    client_id?: string;
    product_id?: string;
    server_id?: string;
    per_page?: string;
    page?: string;
  } = {},
  mode: ServiceApiMode = "admin",
): Promise<PaginatedResponse<ServiceRecord> | null> {
  const url = new URL(`${endpoint(mode)}/services`);

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

  return (await response.json()) as PaginatedResponse<ServiceRecord>;
}

export async function fetchServersFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status?: string;
    panel_type?: string;
    server_group_id?: string;
    per_page?: string;
    page?: string;
  } = {},
): Promise<PaginatedResponse<ServerRecord> | null> {
  const url = new URL(`${apiBaseUrl}/admin/servers`);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PaginatedResponse<ServerRecord>;
}

export async function fetchServerFromCookies(
  cookieHeader: string,
  serverId: string,
): Promise<ServerRecord | null> {
  const response = await fetch(`${apiBaseUrl}/admin/servers/${serverId}`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: ServerRecord };

  return payload.data;
}

export async function fetchServiceFromCookies(
  cookieHeader: string,
  serviceId: string,
  mode: ServiceApiMode = "admin",
): Promise<ServiceRecord | null> {
  const response = await fetch(`${endpoint(mode)}/services/${serviceId}`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, mode === "client" ? "/portal" : "/dashboard"),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: ServiceRecord };

  return payload.data;
}

export async function fetchProvisioningJobsFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status?: string;
    operation?: string;
    service_id?: string;
    server_id?: string;
    per_page?: string;
    page?: string;
  } = {},
): Promise<PaginatedResponse<ProvisioningJobRecord> | null> {
  const url = new URL(`${apiBaseUrl}/admin/provisioning-jobs`);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PaginatedResponse<ProvisioningJobRecord>;
}

export async function dispatchProvisioningOperation(
  serviceId: string,
  operation: ProvisioningOperation,
  payload: Record<string, unknown> = {},
  xsrfToken?: string | null,
): Promise<ProvisioningJobRecord> {
  const response = await fetch(`${apiBaseUrl}/admin/services/${serviceId}/operations/${operation}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    },
    body: JSON.stringify({ payload }),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(errorPayload?.message ?? "Unable to dispatch the provisioning operation.");
  }

  const data = (await response.json()) as { data: ProvisioningJobRecord };

  return data.data;
}
