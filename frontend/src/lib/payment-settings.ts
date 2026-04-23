import {
  apiBaseUrl,
  ensureCsrfCookie,
  readBrowserCookie,
  statefulApiHeaders,
} from "@/lib/auth";

type MutationResult<T> = {
  data: T | null;
  error: string | null;
  errors: Record<string, string[]> | null;
  status: number;
};

export type TenantPaymentGatewaySettingsRecord = {
  stripe: {
    enabled: boolean;
    publishable_key: string;
    secret_key: string;
    webhook_secret: string;
  };
  paypal: {
    enabled: boolean;
    client_id: string;
    client_secret: string;
    webhook_id: string;
    mode: "sandbox" | "live";
  };
  offline: {
    enabled: boolean;
    instructions: string;
  };
};

function firstErrorMessage(
  payload:
    | {
        message?: string;
        errors?: Record<string, string[]>;
      }
    | null,
): string | null {
  if (payload?.message) {
    return payload.message;
  }

  if (!payload?.errors) {
    return null;
  }

  return Object.values(payload.errors)[0]?.[0] ?? null;
}

export async function fetchTenantPaymentGatewaySettingsFromCookies(
  cookieHeader: string,
): Promise<TenantPaymentGatewaySettingsRecord | null> {
  const response = await fetch(`${apiBaseUrl}/admin/settings/payments/gateways`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, "/dashboard/settings/payments"),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: TenantPaymentGatewaySettingsRecord };
  return payload.data;
}

export async function updateTenantPaymentGatewaySettings(
  payload: TenantPaymentGatewaySettingsRecord,
): Promise<MutationResult<TenantPaymentGatewaySettingsRecord>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/admin/settings/payments/gateways`, {
      method: "PUT",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | {
          data?: TenantPaymentGatewaySettingsRecord;
          message?: string;
          errors?: Record<string, string[]>;
        }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Request failed.",
        errors: responsePayload?.errors ?? null,
        status: response.status,
      };
    }

    return {
      data: responsePayload?.data ?? null,
      error: null,
      errors: null,
      status: response.status,
    };
  } catch {
    return {
      data: null,
      error: "Service unavailable.",
      errors: null,
      status: 0,
    };
  }
}
