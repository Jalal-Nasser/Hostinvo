import { apiBaseUrl, statefulApiHeaders } from "@/lib/auth";
import { type BillingCycle } from "@/lib/catalog";

export const orderStatuses = [
  "draft",
  "pending",
  "accepted",
  "cancelled",
  "fraud",
  "completed",
] as const;

export const discountTypes = ["fixed", "percentage"] as const;
export const orderDraftStorageKey = "hostinvo-order-draft";

export type OrderStatus = (typeof orderStatuses)[number];
export type DiscountType = (typeof discountTypes)[number];

export type OrderItemSelectionPayload = {
  configurable_option_id: string;
  selected_value: string | number | boolean | null;
};

export type OrderItemPayload = {
  product_id: string;
  billing_cycle: BillingCycle;
  quantity: number;
  configurable_options?: OrderItemSelectionPayload[];
};

export type OrderFormPayload = {
  client_id: string;
  currency?: string | null;
  coupon_code?: string | null;
  discount_type?: DiscountType | null;
  discount_value?: number | null;
  tax_rate_bps?: number;
  notes?: string | null;
  items: OrderItemPayload[];
};

export type OrderItemRecord = {
  id?: string;
  product_id: string | null;
  product_name: string;
  product_type: string;
  billing_cycle: BillingCycle;
  quantity: number;
  unit_price_minor: number;
  setup_fee_minor: number;
  subtotal_minor: number;
  total_minor: number;
  product_snapshot?: {
    id: string;
    name: string;
    slug: string;
    sku?: string | null;
    type: string;
  } | null;
  configurable_options?: Array<{
    configurable_option_id: string;
    name: string;
    code: string;
    option_type: string;
    selected_value: string | number | boolean | null;
    selected_label: string;
  }>;
};

export type OrderRecord = {
  id: string;
  tenant_id: string;
  client_id: string;
  user_id: string | null;
  reference_number: string;
  status: OrderStatus;
  currency: string;
  coupon_code: string | null;
  discount_type: DiscountType | null;
  discount_value: number;
  discount_amount_minor: number;
  tax_rate_bps: number;
  tax_amount_minor: number;
  subtotal_minor: number;
  total_minor: number;
  notes: string | null;
  placed_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  items_count?: number;
  client?: {
    id: string;
    display_name: string;
    email: string;
    currency: string;
    preferred_locale: string;
  } | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  items?: OrderItemRecord[];
  created_at: string;
  updated_at: string;
};

export type OrderPreviewRecord = Omit<
  OrderRecord,
  "id" | "tenant_id" | "client_id" | "user_id" | "items_count" | "owner" | "created_at" | "updated_at"
> & {
  client: NonNullable<OrderRecord["client"]>;
  items: OrderItemRecord[];
};

type PaginatedOrderResponse = {
  data: OrderRecord[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export async function fetchOrdersFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status?: string;
    client_id?: string;
    per_page?: string;
    page?: string;
  } = {},
): Promise<PaginatedOrderResponse | null> {
  const url = new URL(`${apiBaseUrl}/admin/orders`);

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

  return (await response.json()) as PaginatedOrderResponse;
}

export async function fetchOrderFromCookies(
  cookieHeader: string,
  orderId: string,
): Promise<OrderRecord | null> {
  const response = await fetch(`${apiBaseUrl}/admin/orders/${orderId}`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: OrderRecord };

  return payload.data;
}

export function formatMinorCurrency(minor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(minor / 100);
}

export function decimalToMinor(value: string): number {
  const normalized = value.trim();

  if (normalized === "") {
    return 0;
  }

  const [wholePart, decimalPart = "0"] = normalized.replace(/[^0-9.\-]/g, "").split(".");
  const whole = Number(wholePart || "0");
  const decimal = Number(decimalPart.padEnd(2, "0").slice(0, 2));

  return whole * 100 + decimal;
}

export function percentToBps(value: string): number {
  const normalized = value.trim();

  if (normalized === "") {
    return 0;
  }

  const numeric = Number(normalized);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.round(numeric * 100));
}

export function bpsToPercentString(value: number): string {
  return (value / 100).toFixed(2);
}
