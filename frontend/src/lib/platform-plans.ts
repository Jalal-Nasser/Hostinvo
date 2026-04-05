import { apiBaseUrl, statefulApiHeaders } from "@/lib/auth";
import { submitAdminJson } from "@/lib/tenant-admin";

export type PlatformPlan = {
  key: string;
  label: string;
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
  return submitAdminJson<PlatformPlansPayload>("platform/plans", "PUT", payload);
}
