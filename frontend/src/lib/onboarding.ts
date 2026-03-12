"use client";

import { apiBaseUrl, backendOrigin } from "@/lib/auth";

export type OnboardingStatusPayload = {
  tenant: {
    id: string;
    name: string;
    primary_domain: string | null;
    default_locale: string;
    default_currency: string;
    timezone: string;
  };
  license: {
    plan: string;
    status: string;
    max_clients: number | null;
    max_services: number | null;
    expires_at: string | null;
  } | null;
  steps: Array<{ key: string; complete: boolean }>;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  is_complete: boolean;
};

export type RegisterProviderPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company_name: string;
  company_domain?: string;
  default_locale?: string;
  default_currency?: string;
  timezone?: string;
  license_key?: string;
  license_domain?: string;
  license_instance_id?: string;
};

type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
  errors?: Array<{ message?: string }>;
  message?: string;
};

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

async function ensureCsrfCookie() {
  await fetch(`${backendOrigin}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const response = payload as {
    message?: string;
    errors?: Record<string, string[]>;
  };

  const firstError = response.errors
    ? Object.values(response.errors).flat()[0]
    : null;

  return response.message ?? firstError ?? fallback;
}

export async function registerProvider(payload: RegisterProviderPayload): Promise<{
  ok: boolean;
  message?: string;
}> {
  await ensureCsrfCookie();

  const xsrfToken = readCookie("XSRF-TOKEN");

  const response = await fetch(`${apiBaseUrl}/auth/provider-register`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);

    return {
      ok: false,
      message: extractErrorMessage(errorPayload, "Provider registration failed."),
    };
  }

  return { ok: true };
}

export async function fetchOnboardingStatus(): Promise<{
  ok: boolean;
  status?: OnboardingStatusPayload;
  message?: string;
}> {
  const response = await fetch(`${apiBaseUrl}/auth/onboarding/status`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { ok: false, message: "unauthenticated" };
    }

    const payload = await response.json().catch(() => null);

    return {
      ok: false,
      message: extractErrorMessage(payload, "Unable to load onboarding status."),
    };
  }

  const payload = (await response.json()) as ApiEnvelope<OnboardingStatusPayload>;

  return {
    ok: true,
    status: payload.data,
  };
}

export async function updateOnboardingCompany(payload: {
  company_name: string;
  company_domain: string;
  default_locale: string;
  default_currency: string;
  timezone: string;
}): Promise<{ ok: boolean; message?: string }> {
  await ensureCsrfCookie();

  const xsrfToken = readCookie("XSRF-TOKEN");

  const response = await fetch(`${apiBaseUrl}/auth/onboarding/company`, {
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

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);

    return {
      ok: false,
      message: extractErrorMessage(errorPayload, "Unable to save company settings."),
    };
  }

  return { ok: true };
}
