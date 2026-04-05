import { apiBaseUrl, backendOrigin, statefulApiHeaders } from "@/lib/auth";

export type PlatformPlan = {
  key: string;
  label: string;
  marketing_name?: string | null;
  description?: string | null;
  features?: string[];
  monthly_price: number | null;
  max_clients: number;
  max_services: number | null;
  activation_limit: number | null;
  duration_days: number | null;
  is_trial: boolean;
};

export type PlatformPlansPayload = {
  pricing_note: string | null;
  plans: PlatformPlan[];
};

type MutationResult<T> = {
  data: T | null;
  error: string | null;
  errors: Record<string, string[]> | null;
  status: number;
};

async function ensureCsrfCookie() {
  await fetch(`${backendOrigin}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function parseErrors(
  payload: { errors?: Record<string, string[]> | Array<{ message?: string }> } | null,
) {
  if (!payload?.errors) {
    return null;
  }

  if (Array.isArray(payload.errors)) {
    const firstMessage = payload.errors[0]?.message;
    return firstMessage ? { general: [firstMessage] } : null;
  }

  return payload.errors;
}

function firstErrorMessage(
  payload:
    | { message?: string; errors?: Record<string, string[]> | Array<{ message?: string }> }
    | null,
): string | null {
  if (payload?.message) {
    return payload.message;
  }

  const errors = parseErrors(payload);
  if (!errors) {
    return null;
  }

  return Object.values(errors)[0]?.[0] ?? null;
}

export async function fetchPlatformPlansFromCookies(
  cookieHeader: string,
): Promise<PlatformPlansPayload | null> {
  const response = await fetch(`${apiBaseUrl}/platform/plans`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, "/dashboard/plans"),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PlatformPlansPayload;
}

export async function updatePlatformPlans(
  payload: PlatformPlansPayload,
): Promise<MutationResult<PlatformPlansPayload>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/platform/plans`, {
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
      | { data?: PlatformPlansPayload; message?: string; errors?: Record<string, string[]> | Array<{ message?: string }> }
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
