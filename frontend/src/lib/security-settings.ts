import {
  apiBaseUrl,
  backendOrigin,
  readBrowserCookie,
  ensureCsrfCookie,
  statefulApiHeaders,
} from "@/lib/auth";

export type TurnstileSettingsRecord = {
  enabled: boolean;
  use_custom_keys?: boolean;
  site_key: string;
  secret_key: string;
  forms: Record<string, boolean>;
};

export type ManagedNotificationTemplate = {
  id: number;
  scope: "platform" | "tenant";
  event: string;
  locale: "en" | "ar";
  subject: string;
  body_html: string;
  body_text: string | null;
  is_enabled: boolean;
};

export type NotificationTemplateIndexPayload = {
  scope: "platform" | "tenant";
  events: string[];
  templates: ManagedNotificationTemplate[];
};

type MutationResult<T> = {
  data: T | null;
  error: string | null;
  errors: Record<string, string[]> | null;
  status: number;
};

function parseErrors(
  payload:
    | {
        errors?: Array<{ message?: string }> | Record<string, string[]>;
      }
    | null,
): Record<string, string[]> | null {
  if (!payload?.errors) {
    return null;
  }

  if (Array.isArray(payload.errors)) {
    const first = payload.errors[0]?.message;
    return first ? { general: [first] } : null;
  }

  return payload.errors;
}

function firstErrorMessage(
  payload:
    | {
        message?: string;
        errors?: Array<{ message?: string }> | Record<string, string[]>;
      }
    | null,
): string | null {
  if (payload?.message) {
    return payload.message;
  }

  const errors = parseErrors(payload);
  return errors ? Object.values(errors)[0]?.[0] ?? null : null;
}

async function fetchJson<T>(
  url: string,
  cookieHeader: string,
  refererPath: string,
): Promise<T | null> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, refererPath),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
}

async function submitJson<T>(
  url: string,
  method: "PUT",
  payload: unknown,
): Promise<MutationResult<T>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(url, {
      method,
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
          data?: T;
          message?: string;
          errors?: Array<{ message?: string }> | Record<string, string[]>;
        }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Request failed.",
        errors: parseErrors(responsePayload),
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

function platformEndpoint(path: string): string {
  return `${apiBaseUrl}/platform/${path}`;
}

function tenantEndpoint(path: string): string {
  return `${apiBaseUrl}/admin/${path}`;
}

export async function fetchPlatformTurnstileFromCookies(
  cookieHeader: string,
): Promise<TurnstileSettingsRecord | null> {
  return fetchJson<TurnstileSettingsRecord>(
    platformEndpoint("security/turnstile"),
    cookieHeader,
    "/dashboard/settings/security",
  );
}

export async function fetchTenantTurnstileFromCookies(
  cookieHeader: string,
): Promise<TurnstileSettingsRecord | null> {
  return fetchJson<TurnstileSettingsRecord>(
    tenantEndpoint("settings/security/turnstile"),
    cookieHeader,
    "/dashboard/settings/security",
  );
}

export async function updatePlatformTurnstile(
  payload: TurnstileSettingsRecord,
): Promise<MutationResult<TurnstileSettingsRecord>> {
  return submitJson<TurnstileSettingsRecord>(
    platformEndpoint("security/turnstile"),
    "PUT",
    payload,
  );
}

export async function updateTenantTurnstile(
  payload: TurnstileSettingsRecord,
): Promise<MutationResult<TurnstileSettingsRecord>> {
  return submitJson<TurnstileSettingsRecord>(
    tenantEndpoint("settings/security/turnstile"),
    "PUT",
    payload,
  );
}

export async function fetchPlatformNotificationTemplatesFromCookies(
  cookieHeader: string,
): Promise<NotificationTemplateIndexPayload | null> {
  return fetchJson<NotificationTemplateIndexPayload>(
    platformEndpoint("notifications/templates"),
    cookieHeader,
    "/dashboard/settings/notifications",
  );
}

export async function fetchTenantNotificationTemplatesFromCookies(
  cookieHeader: string,
): Promise<NotificationTemplateIndexPayload | null> {
  return fetchJson<NotificationTemplateIndexPayload>(
    tenantEndpoint("settings/notifications/templates"),
    cookieHeader,
    "/dashboard/settings/notifications",
  );
}

export async function updatePlatformNotificationTemplate(
  event: string,
  locale: "en" | "ar",
  payload: Omit<ManagedNotificationTemplate, "id" | "scope" | "event" | "locale">,
): Promise<MutationResult<ManagedNotificationTemplate>> {
  return submitJson<ManagedNotificationTemplate>(
    platformEndpoint(`notifications/templates/${event}/${locale}`),
    "PUT",
    payload,
  );
}

export async function updateTenantNotificationTemplate(
  event: string,
  locale: "en" | "ar",
  payload: Omit<ManagedNotificationTemplate, "id" | "scope" | "event" | "locale">,
): Promise<MutationResult<ManagedNotificationTemplate>> {
  return submitJson<ManagedNotificationTemplate>(
    tenantEndpoint(`settings/notifications/templates/${event}/${locale}`),
    "PUT",
    payload,
  );
}
