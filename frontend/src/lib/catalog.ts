import { apiBaseUrl, statefulApiHeaders } from "@/lib/auth";

export const productGroupStatuses = ["active", "inactive"] as const;
export const productStatuses = ["draft", "active", "inactive", "archived"] as const;
export const visibilityOptions = ["public", "private", "hidden"] as const;
export const productTypes = ["hosting"] as const;
export const provisioningModules = ["cpanel", "plesk", "directadmin", "custom"] as const;
export const configurableOptionTypes = ["select", "radio", "quantity", "yes_no"] as const;
export const billingCycles = [
  "monthly",
  "quarterly",
  "semiannually",
  "annually",
  "biennially",
  "triennially",
] as const;

export type ProductGroupStatus = (typeof productGroupStatuses)[number];
export type ProductStatus = (typeof productStatuses)[number];
export type VisibilityOption = (typeof visibilityOptions)[number];
export type ProductType = (typeof productTypes)[number];
export type ProvisioningModule = (typeof provisioningModules)[number];
export type ConfigurableOptionType = (typeof configurableOptionTypes)[number];
export type BillingCycle = (typeof billingCycles)[number];

export type ProductGroupRecord = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductGroupStatus;
  visibility: VisibilityOption;
  display_order: number;
  products_count?: number;
  created_at: string;
  updated_at: string;
};

export type ProductPricingRecord = {
  id: string;
  billing_cycle: BillingCycle;
  currency: string;
  price: string;
  setup_fee: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type ConfigurableOptionChoiceRecord = {
  id?: string;
  label: string;
  value: string;
  is_default: boolean;
  display_order: number;
};

export type ConfigurableOptionRecord = {
  id?: string;
  name: string;
  code: string;
  option_type: ConfigurableOptionType;
  description?: string | null;
  status: "active" | "inactive";
  is_required: boolean;
  display_order: number;
  choices: ConfigurableOptionChoiceRecord[];
};

export type ProductRecord = {
  id: string;
  tenant_id: string;
  product_group_id: string | null;
  server_id: number | null;
  type: ProductType;
  provisioning_module: ProvisioningModule | null;
  provisioning_package: string | null;
  name: string;
  slug: string;
  sku: string | null;
  summary: string | null;
  description: string | null;
  status: ProductStatus;
  visibility: VisibilityOption;
  display_order: number;
  is_featured: boolean;
  starting_price?: {
    billing_cycle: BillingCycle;
    currency: string;
    price: string;
  } | null;
  group?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  server?: {
    id: number;
    name: string;
    hostname: string;
    panel_type: ProvisioningModule;
    status: string;
  } | null;
  pricing_count?: number;
  configurable_options_count?: number;
  pricing?: ProductPricingRecord[];
  configurable_options?: ConfigurableOptionRecord[];
  created_at: string;
  updated_at: string;
};

export type ProductGroupFormPayload = {
  name: string;
  slug?: string | null;
  description?: string | null;
  status: ProductGroupStatus;
  visibility: VisibilityOption;
  display_order: number;
};

export type ProductFormPayload = {
  product_group_id?: string | null;
  server_id?: number | null;
  type: ProductType;
  provisioning_module?: ProvisioningModule | null;
  provisioning_package?: string | null;
  name: string;
  slug?: string | null;
  sku?: string | null;
  summary?: string | null;
  description?: string | null;
  status: ProductStatus;
  visibility: VisibilityOption;
  display_order: number;
  is_featured: boolean;
  configurable_options?: ConfigurableOptionRecord[];
};

export type ProductPricingPayload = {
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

export async function fetchProductGroupsFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status?: string;
    visibility?: string;
    per_page?: string;
    page?: string;
  } = {},
): Promise<PaginatedResponse<ProductGroupRecord> | null> {
  const url = new URL(`${apiBaseUrl}/admin/product-groups`);

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

  return (await response.json()) as PaginatedResponse<ProductGroupRecord>;
}

export async function fetchProductsFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status?: string;
    visibility?: string;
    type?: string;
    product_group_id?: string;
    per_page?: string;
    page?: string;
  } = {},
): Promise<PaginatedResponse<ProductRecord> | null> {
  const url = new URL(`${apiBaseUrl}/admin/products`);

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

  return (await response.json()) as PaginatedResponse<ProductRecord>;
}

export async function fetchProductFromCookies(
  cookieHeader: string,
  productId: string,
): Promise<ProductRecord | null> {
  const response = await fetch(`${apiBaseUrl}/admin/products/${productId}`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: ProductRecord };

  return payload.data;
}
