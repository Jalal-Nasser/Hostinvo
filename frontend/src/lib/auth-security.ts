import {
  apiBaseUrl,
  backendOrigin,
  defaultWorkspacePath,
  ensureCsrfCookie,
  type AuthenticatedUser,
  readBrowserCookie,
  tenantHostHeader,
} from "@/lib/auth";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  SerializedCredential,
} from "@/lib/webauthn";

export type TurnstilePublicConfig = {
  enabled: boolean;
  site_key: string;
  forms: Record<string, boolean>;
};

export type MfaPendingStatus = {
  mode: "setup" | "challenge";
  email: string;
  secret?: string | null;
  otp_auth_url?: string | null;
  recovery_codes_remaining: number;
  methods?: string[];
};

export type MfaAuthenticatedStatus = {
  enrolled: boolean;
  recovery_codes_remaining: number;
};

export type NotificationTemplateRecord = {
  id: number;
  scope: "platform" | "tenant";
  event: string;
  locale: "en" | "ar";
  subject: string;
  body_html: string;
  body_text: string | null;
  is_enabled: boolean;
};

type ApiEnvelope<T> = {
  data: T;
  errors?: Array<{ message?: string }> | Record<string, string[]>;
};

type MutationResult<T> = {
  data: T | null;
  error: string | null;
  errors: Record<string, string[]> | null;
  status: number;
};

export type AuthConfigResponse = {
  turnstile: TurnstilePublicConfig;
};

export type LoginFlowResponse = {
  status: "authenticated" | "mfa_required" | "mfa_setup_required";
  user?: AuthenticatedUser | null;
  redirectTo?: string;
};

export type PasskeyListResponse = {
  items: Array<{
    id: number;
    label: string;
    created_at?: string | null;
    last_used_at?: string | null;
  }>;
};

export type MfaStatusResponse =
  | {
      state: "pending";
      mfa: MfaPendingStatus;
    }
  | {
      state: "authenticated";
      mfa: MfaAuthenticatedStatus;
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
  if (payload && typeof payload === "object" && "message" in payload && payload.message) {
    return payload.message;
  }

  const errors = parseErrors(payload);
  return errors ? Object.values(errors)[0]?.[0] ?? null : null;
}

async function parseResponse<T>(response: Response): Promise<T | null> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  return payload?.data ?? null;
}

export async function fetchAuthConfig(): Promise<AuthConfigResponse | null> {
  const response = await fetch(`${apiBaseUrl}/auth/config`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...tenantHostHeader(),
    },
  });

  if (!response.ok) {
    return null;
  }

  return parseResponse<AuthConfigResponse>(response);
}

export async function submitLogin(
  payload: {
    email: string;
    password: string;
    remember: boolean;
    turnstile_token?: string;
  },
  locale: string,
): Promise<MutationResult<LoginFlowResponse>> {
  try {
    await ensureCsrfCookie();

    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...tenantHostHeader(),
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: { status?: LoginFlowResponse["status"]; user?: AuthenticatedUser | null }; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Login failed.",
        errors: parseErrors(responsePayload),
        status: response.status,
      };
    }

    const status = responsePayload?.data?.status ?? "authenticated";
    const user = responsePayload?.data?.user ?? null;

    return {
      data: {
        status,
        user,
        redirectTo:
          status === "authenticated"
            ? defaultWorkspacePath(locale, user ?? null)
            : undefined,
      },
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

export async function submitPasswordResetRequest(payload: {
  email: string;
  turnstile_token?: string;
}): Promise<MutationResult<{ message?: string }>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...tenantHostHeader(),
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: { message?: string }; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to send the reset link.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function submitPasswordReset(payload: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
  tenant_id?: string;
  tenant_signature?: string;
  turnstile_token?: string;
}): Promise<MutationResult<{ message?: string }>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...tenantHostHeader(),
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: { message?: string }; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to reset the password.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function resendVerificationEmail(payload: {
  email: string;
  locale?: string;
  turnstile_token?: string;
}): Promise<MutationResult<{ message?: string }>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/verify-email/resend`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...tenantHostHeader(),
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: { message?: string }; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to resend the verification email.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function fetchMfaStatus(): Promise<MutationResult<MfaStatusResponse>> {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/mfa/status`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: MfaStatusResponse; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to load MFA state.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function beginMfaSetup(): Promise<MutationResult<{ state: "pending" | "authenticated"; setup: { secret: string; otp_auth_url: string } }>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/mfa/setup`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: { state: "pending" | "authenticated"; setup: { secret: string; otp_auth_url: string } }; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to start MFA setup.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function confirmMfaSetup(payload: {
  code: string;
  current_password?: string;
}): Promise<MutationResult<{ status: string; user?: AuthenticatedUser | null; recovery_codes: string[] }>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/mfa/setup/confirm`, {
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

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: { status: string; user?: AuthenticatedUser | null; recovery_codes: string[] }; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to confirm MFA setup.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function submitMfaChallenge(payload: {
  code?: string;
  recovery_code?: string;
}): Promise<MutationResult<{ status: string; user?: AuthenticatedUser | null }>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/mfa/challenge`, {
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

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: { status: string; user?: AuthenticatedUser | null }; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to complete the MFA challenge.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function regenerateMfaRecoveryCodes(payload: {
  current_password: string;
}): Promise<MutationResult<{ recovery_codes: string[] }>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/mfa/recovery-codes/regenerate`, {
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

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: { recovery_codes: string[] }; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to regenerate recovery codes.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function disableTotp(payload: {
  current_password: string;
}): Promise<MutationResult<null>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/mfa/totp`, {
      method: "DELETE",
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
      | { data?: null; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to disable MFA.",
        errors: parseErrors(responsePayload),
        status: response.status,
      };
    }

    return {
      data: null,
      error: null,
      errors: null,
      status: response.status,
    };
  } catch {
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function fetchPasskeys(): Promise<MutationResult<PasskeyListResponse>> {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/passkeys`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: PasskeyListResponse; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to load passkeys.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function beginPasskeyRegistration(): Promise<
  MutationResult<PublicKeyCredentialCreationOptionsJSON>
> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/passkeys/register/options`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: PublicKeyCredentialCreationOptionsJSON; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to start passkey registration.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function finishPasskeyRegistration(payload: {
  credential: SerializedCredential;
  label?: string;
}): Promise<MutationResult<{ id: number; label: string }>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/passkeys/register/verify`, {
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

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: { id: number; label: string }; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to register passkey.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function beginPasskeyAuthentication(payload?: {
  email?: string;
}): Promise<MutationResult<PublicKeyCredentialRequestOptionsJSON>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/passkeys/authenticate/options`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
      body: JSON.stringify(payload ?? {}),
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: PublicKeyCredentialRequestOptionsJSON; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to start passkey login.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function finishPasskeyAuthentication(payload: {
  credential: SerializedCredential;
}): Promise<MutationResult<LoginFlowResponse>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/passkeys/authenticate/verify`, {
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

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: LoginFlowResponse; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to complete passkey login.",
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
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function renamePasskey(payload: {
  id: number;
  label: string;
}): Promise<MutationResult<null>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/passkeys/${payload.id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
      body: JSON.stringify({ label: payload.label }),
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: null; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to rename passkey.",
        errors: parseErrors(responsePayload),
        status: response.status,
      };
    }

    return { data: null, error: null, errors: null, status: response.status };
  } catch {
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}

export async function removePasskey(payload: {
  id: number;
  current_password: string;
}): Promise<MutationResult<null>> {
  try {
    await ensureCsrfCookie();
    const xsrfToken = readBrowserCookie("XSRF-TOKEN");
    const response = await fetch(`${apiBaseUrl}/auth/passkeys/${payload.id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
      body: JSON.stringify({ current_password: payload.current_password }),
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: null; message?: string; errors?: Array<{ message?: string }> | Record<string, string[]> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Unable to remove passkey.",
        errors: parseErrors(responsePayload),
        status: response.status,
      };
    }

    return { data: null, error: null, errors: null, status: response.status };
  } catch {
    return { data: null, error: "Service unavailable.", errors: null, status: 0 };
  }
}
