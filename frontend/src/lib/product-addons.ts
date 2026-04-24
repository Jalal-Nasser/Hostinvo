import { apiBaseUrl, statefulApiHeaders } from "@/lib/auth";
import { billingCycles, type BillingCycle } from "@/lib/catalog";

export const productAddonStatuses = ["active", "hidden", "archived"] as const;
export const productAddonVisibility = ["visible", "hidden"] as const;

export type ProductAddonStatus = (typeof productAddonStatuses)[number];
export type ProductAddonVisibility = (typeof productAddonVisibility)[number];

export type ProductAddonPricingRecord = {
  id: string;
  billing_cycle: BillingCycle;
  currency: string;
  price: string;
  setup_fee: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductAddonRecord = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductAddonStatus;
  visibility: ProductAddonVisibility;
  apply_tax: boolean;
  auto_activate: boolean;
  welcome_email: string | null;
  starting_price?: {
    billing_cycle: BillingCycle;
    currency: string;
    price: string;
  } | null;
  products?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  pricing?: ProductAddonPricingRecord[];
  products_count?: number;
  created_at: string;
  updated_at: string;
};

export type ProductAddonPayload = {
  name: string;
  slug?: string | null;
  description?: string | null;
  status: ProductAddonStatus;
  visibility: ProductAddonVisibility;
  apply_tax: boolean;
  auto_activate: boolean;
  welcome_email?: string | null;
  product_ids: string[];
  pricing: Array<{
    billing_cycle: BillingCycle;
    currency: string;
    price: number;
    setup_fee: number;
    is_enabled: boolean;
  }>;
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

export { billingCycles };

export async function fetchProductAddonsFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status?: string;
    visibility?: string;
    per_page?: string;
    page?: string;
  } = {},
): Promise<PaginatedResponse<ProductAddonRecord> | null> {
  const url = new URL(`${apiBaseUrl}/admin/product-addons`);

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

  return (await response.json()) as PaginatedResponse<ProductAddonRecord>;
}

export async function fetchProductAddonFromCookies(
  cookieHeader: string,
  addonId: string,
): Promise<ProductAddonRecord | null> {
  const response = await fetch(`${apiBaseUrl}/admin/product-addons/${addonId}`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: ProductAddonRecord };

  return payload.data;
}
