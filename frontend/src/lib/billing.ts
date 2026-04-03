import { apiBaseUrl, statefulApiHeaders } from "@/lib/auth";
import { type BillingCycle } from "@/lib/catalog";
import { bpsToPercentString, decimalToMinor, formatMinorCurrency, percentToBps } from "@/lib/orders";

export const invoiceStatuses = [
  "draft",
  "unpaid",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
] as const;

export const paymentStatuses = ["pending", "completed", "failed", "cancelled"] as const;
export const paymentTypes = ["payment", "refund", "credit"] as const;
export const invoiceItemTypes = ["manual", "order", "service"] as const;
export const gatewayCodes = ["stripe", "paypal"] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentType = (typeof paymentTypes)[number];
export type InvoiceItemType = (typeof invoiceItemTypes)[number];
export type GatewayCode = (typeof gatewayCodes)[number];

export type TransactionRecord = {
  id: string;
  payment_id: string | null;
  invoice_id: string | null;
  client_id: string | null;
  type: PaymentType | "adjustment";
  status: PaymentStatus;
  gateway: string;
  external_reference: string | null;
  currency: string;
  amount_minor: number;
  occurred_at: string | null;
  request_payload?: Record<string, unknown> | null;
  response_payload?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type GatewayOptionRecord = {
  code: GatewayCode;
  label: string;
  description: string;
  enabled: boolean;
  usable: boolean;
};

export type PaymentRecord = {
  id: string;
  tenant_id: string;
  invoice_id: string | null;
  client_id: string;
  user_id: string | null;
  type: PaymentType;
  status: PaymentStatus;
  payment_method: string;
  currency: string;
  amount_minor: number;
  reference: string | null;
  paid_at: string | null;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
  client?: {
    id: string;
    display_name: string;
    email: string;
  } | null;
  invoice?: {
    id: string;
    reference_number: string;
    status: InvoiceStatus;
  } | null;
  transactions?: TransactionRecord[];
  created_at: string;
  updated_at: string;
};

export type InvoiceItemRecord = {
  id?: string;
  invoice_id?: string;
  order_item_id: string | null;
  item_type: InvoiceItemType;
  description: string;
  related_type: string | null;
  related_id: string | null;
  billing_cycle: BillingCycle | null;
  billing_period_starts_at: string | null;
  billing_period_ends_at: string | null;
  quantity: number;
  unit_price_minor: number;
  subtotal_minor: number;
  discount_amount_minor: number;
  tax_amount_minor: number;
  total_minor: number;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type InvoiceRecord = {
  id: string;
  tenant_id: string;
  client_id: string;
  order_id: string | null;
  user_id: string | null;
  reference_number: string;
  status: InvoiceStatus;
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  recurring_cycle: BillingCycle | null;
  next_invoice_date: string | null;
  discount_type: "fixed" | "percentage" | null;
  discount_value: number;
  discount_amount_minor: number;
  credit_applied_minor: number;
  tax_rate_bps: number;
  tax_amount_minor: number;
  subtotal_minor: number;
  total_minor: number;
  amount_paid_minor: number;
  refunded_amount_minor: number;
  balance_due_minor: number;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
  items_count?: number;
  payments_count?: number;
  client?: {
    id: string;
    display_name: string;
    email: string;
    currency: string;
    preferred_locale: string;
  } | null;
  order?: {
    id: string;
    reference_number: string;
    status: string;
  } | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  items?: InvoiceItemRecord[];
  payments?: PaymentRecord[];
  transactions?: TransactionRecord[];
  created_at: string;
  updated_at: string;
};

export type InvoiceFormPayload = {
  client_id: string;
  order_id?: string | null;
  currency?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  status?: InvoiceStatus | null;
  recurring_cycle?: BillingCycle | null;
  next_invoice_date?: string | null;
  discount_type?: "fixed" | "percentage" | null;
  discount_value?: number | null;
  credit_applied_minor?: number;
  tax_rate_bps?: number;
  notes?: string | null;
  items?: Array<{
    id?: string;
    order_item_id?: string | null;
    item_type: InvoiceItemType;
    description: string;
    related_type?: string | null;
    related_id?: string | null;
    billing_cycle?: BillingCycle | null;
    billing_period_starts_at?: string | null;
    billing_period_ends_at?: string | null;
    quantity: number;
    unit_price_minor: number;
    metadata?: Record<string, unknown> | null;
  }>;
};

export type GatewayCheckoutRecord = {
  gateway: GatewayCode;
  redirect_url: string;
  external_reference: string;
  payment: PaymentRecord;
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

export async function fetchInvoicesFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    status?: string;
    client_id?: string;
    order_id?: string;
    per_page?: string;
    page?: string;
  } = {},
): Promise<PaginatedResponse<InvoiceRecord> | null> {
  const url = new URL(`${apiBaseUrl}/admin/invoices`);

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

  return (await response.json()) as PaginatedResponse<InvoiceRecord>;
}

export async function fetchInvoiceFromCookies(
  cookieHeader: string,
  invoiceId: string,
): Promise<InvoiceRecord | null> {
  const response = await fetch(`${apiBaseUrl}/admin/invoices/${invoiceId}`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: InvoiceRecord };

  return payload.data;
}

export async function fetchPaymentsFromCookies(
  cookieHeader: string,
  filters: {
    search?: string;
    invoice_id?: string;
    client_id?: string;
    type?: string;
    status?: string;
    per_page?: string;
    page?: string;
  } = {},
): Promise<PaginatedResponse<PaymentRecord> | null> {
  const url = new URL(`${apiBaseUrl}/admin/payments`);

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

  return (await response.json()) as PaginatedResponse<PaymentRecord>;
}

export async function fetchInvoiceGatewayOptionsFromCookies(
  cookieHeader: string,
  invoiceId: string,
): Promise<GatewayOptionRecord[] | null> {
  const response = await fetch(`${apiBaseUrl}/admin/invoices/${invoiceId}/gateway-options`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: GatewayOptionRecord[] };

  return payload.data;
}

export function minorToDecimalString(value: number): string {
  return (value / 100).toFixed(2);
}

export { bpsToPercentString, decimalToMinor, formatMinorCurrency, percentToBps };
