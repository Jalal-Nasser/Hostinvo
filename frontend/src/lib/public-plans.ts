import { apiBaseUrl } from "@/lib/auth";
import type { PlatformPlansPayload } from "@/lib/platform-plans";

export async function fetchPublicPlans(): Promise<PlatformPlansPayload | null> {
  const response = await fetch(`${apiBaseUrl}/plans`, { cache: "no-store" });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PlatformPlansPayload;
}
