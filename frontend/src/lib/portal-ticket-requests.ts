import { backendOrigin, publicApiBaseUrl } from "@/lib/auth";
import { type TicketFormPayload, type TicketRecord } from "@/lib/support";

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

function firstErrorFromPayload(payload: {
  message?: string;
  errors?: Record<string, string[]>;
} | null) {
  if (payload?.message) {
    return payload.message;
  }

  if (!payload?.errors) {
    return null;
  }

  const firstField = Object.values(payload.errors)[0];

  return firstField?.[0] ?? null;
}

export async function createPortalTicketRequest(
  payload: TicketFormPayload,
): Promise<TicketRecord> {
  await ensureCsrfCookie();

  const xsrfToken = readCookie("XSRF-TOKEN");
  const response = await fetch(`${publicApiBaseUrl}/client/tickets`, {
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
    const errorPayload = (await response.json().catch(() => null)) as
      | { message?: string; errors?: Record<string, string[]> }
      | null;

    throw new Error(
      firstErrorFromPayload(errorPayload) ?? "Unable to submit the portal request.",
    );
  }

  const data = (await response.json()) as { data: TicketRecord };

  return data.data;
}
