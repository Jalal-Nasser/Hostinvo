import { apiBaseUrl, backendOrigin, statefulApiHeaders } from "@/lib/auth";

export type AdminContentMode = "admin" | "client";

export type TenantBrandingRecord = {
  company_name: string;
  default_currency: string;
  default_locale: string;
  timezone: string;
  portal_name: string;
  portal_tagline: string;
  logo_path: string | null;
  logo_url: string | null;
  favicon_path: string | null;
  favicon_url: string | null;
};

export type PortalSurfaceEntry = {
  key: string;
  visible: boolean;
  order: number;
  label_en: string | null;
  label_ar: string | null;
};

export type PortalSurfaceSettings = {
  navigation: PortalSurfaceEntry[];
  home_sections: PortalSurfaceEntry[];
  home_cards: PortalSurfaceEntry[];
  content_sources: {
    announcements: boolean;
    knowledgebase: boolean;
    network_status: boolean;
    website_security: boolean;
    footer_links: boolean;
  };
};

export type AnnouncementRecord = {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string | null;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  body_en: string;
  body_ar: string | null;
  status: string;
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  localized_title: string;
  localized_excerpt: string | null;
  localized_body: string;
};

export type KnowledgeBaseCategoryRecord = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  status: string;
  sort_order: number;
  articles_count?: number;
  localized_name: string;
  localized_description: string | null;
  articles?: KnowledgeBaseArticleRecord[];
};

export type KnowledgeBaseArticleRecord = {
  id: string;
  category_id: string | null;
  slug: string;
  title_en: string;
  title_ar: string | null;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  body_en: string;
  body_ar: string | null;
  status: string;
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  localized_title: string;
  localized_excerpt: string | null;
  localized_body: string;
  category?: KnowledgeBaseCategoryRecord | null;
};

export type NetworkIncidentRecord = {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string | null;
  summary_en: string | null;
  summary_ar: string | null;
  details_en: string | null;
  details_ar: string | null;
  status: string;
  severity: string;
  is_public: boolean;
  sort_order: number;
  started_at: string | null;
  resolved_at: string | null;
  localized_title: string;
  localized_summary: string | null;
  localized_details: string | null;
};

export type PortalContentBlockRecord = {
  id: string;
  section: string;
  key: string;
  title_en: string;
  title_ar: string | null;
  body_en: string;
  body_ar: string | null;
  cta_label_en: string | null;
  cta_label_ar: string | null;
  cta_href: string | null;
  status: string;
  sort_order: number;
  localized_title: string;
  localized_body: string;
  localized_cta_label: string | null;
};

export type PortalFooterLinkRecord = {
  id: string;
  group_key: string;
  label_en: string;
  label_ar: string | null;
  href: string;
  is_visible: boolean;
  open_in_new_tab: boolean;
  sort_order: number;
  localized_label: string;
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

type PortalConfigResponse = {
  branding: TenantBrandingRecord;
  surface: PortalSurfaceSettings;
  footer_links: PortalFooterLinkRecord[];
};

type MutationResult<T> = {
  data: T | null;
  error: string | null;
  errors: Record<string, string[]> | null;
  status: number;
};

function adminEndpoint(path: string): string {
  return `${apiBaseUrl}/admin/${path}`;
}

function clientPortalEndpoint(path: string): string {
  return `${apiBaseUrl}/client/portal/${path}`;
}

async function fetchJson<T>(
  url: string,
  cookieHeader: string,
  refererPath: string,
): Promise<T | null> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader, refererPath),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
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

async function ensureCsrfCookie() {
  await fetch(`${backendOrigin}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
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
    | {
        message?: string;
        errors?: Record<string, string[]> | Array<{ message?: string }>;
      }
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

export function localizedValue(
  locale: string,
  english: string | null | undefined,
  arabic: string | null | undefined,
): string {
  if (locale === "ar" && arabic && arabic.trim() !== "") {
    return arabic;
  }

  return english?.trim() || arabic?.trim() || "";
}

export async function submitAdminJson<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH",
  payload: unknown,
): Promise<MutationResult<T>> {
  try {
    await ensureCsrfCookie();

    const xsrfToken = readCookie("XSRF-TOKEN");
    const response = await fetch(adminEndpoint(path), {
      method,
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
      | { data?: T; message?: string; errors?: Record<string, string[]> | Array<{ message?: string }> }
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

export async function submitAdminForm<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH",
  formData: FormData,
): Promise<MutationResult<T>> {
  try {
    await ensureCsrfCookie();

    const xsrfToken = readCookie("XSRF-TOKEN");
    const response = await fetch(adminEndpoint(path), {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
      body: formData,
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: T; message?: string; errors?: Record<string, string[]> | Array<{ message?: string }> }
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

export async function deleteAdminResource(path: string): Promise<MutationResult<null>> {
  try {
    await ensureCsrfCookie();

    const xsrfToken = readCookie("XSRF-TOKEN");
    const response = await fetch(adminEndpoint(path), {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      },
    });

    if (response.status === 204) {
      return { data: null, error: null, errors: null, status: response.status };
    }

    const responsePayload = (await response.json().catch(() => null)) as
      | { data?: null; message?: string; errors?: Record<string, string[]> | Array<{ message?: string }> }
      | null;

    if (!response.ok) {
      return {
        data: null,
        error: firstErrorMessage(responsePayload) ?? "Delete failed.",
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
    return {
      data: null,
      error: "Service unavailable.",
      errors: null,
      status: 0,
    };
  }
}

export async function fetchTenantBrandingFromCookies(
  cookieHeader: string,
): Promise<TenantBrandingRecord | null> {
  const response = await fetchJson<{ data: TenantBrandingRecord }>(
    adminEndpoint("settings/branding"),
    cookieHeader,
    "/dashboard/settings/branding",
  );

  return response?.data ?? null;
}

export async function fetchPortalSurfaceFromCookies(
  cookieHeader: string,
): Promise<PortalSurfaceSettings | null> {
  const response = await fetchJson<{ data: PortalSurfaceSettings }>(
    adminEndpoint("settings/portal-surface"),
    cookieHeader,
    "/dashboard/settings/portal",
  );

  return response?.data ?? null;
}

export async function fetchPortalConfigFromCookies(
  cookieHeader: string,
): Promise<PortalConfigResponse | null> {
  const response = await fetchJson<{ data: PortalConfigResponse }>(
    clientPortalEndpoint("config"),
    cookieHeader,
    "/portal",
  );

  return response?.data ?? null;
}

export async function fetchAnnouncementsFromCookies(
  cookieHeader: string,
  filters: Record<string, string | undefined> = {},
  mode: AdminContentMode = "admin",
): Promise<PaginatedResponse<AnnouncementRecord> | AnnouncementRecord[] | null> {
  const url = new URL(mode === "admin" ? adminEndpoint("announcements") : clientPortalEndpoint("announcements"));
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetchJson<{ data: AnnouncementRecord[]; meta?: PaginatedResponse<AnnouncementRecord>["meta"] }>(
    url.toString(),
    cookieHeader,
    mode === "admin" ? "/dashboard/content/announcements" : "/portal/news",
  );

  if (!response) {
    return null;
  }

  return mode === "admin" ? { data: response.data, meta: response.meta } : response.data;
}

export async function fetchKnowledgeBaseFromCookies(
  cookieHeader: string,
  mode: AdminContentMode = "client",
  filters: Record<string, string | undefined> = {},
): Promise<
  | {
      categories: PaginatedResponse<KnowledgeBaseCategoryRecord> | KnowledgeBaseCategoryRecord[];
      articles: PaginatedResponse<KnowledgeBaseArticleRecord> | null;
    }
  | null
> {
  if (mode === "client") {
    const response = await fetchJson<{ data: KnowledgeBaseCategoryRecord[] }>(
      clientPortalEndpoint("knowledgebase"),
      cookieHeader,
      "/portal/knowledgebase",
    );

    return response ? { categories: response.data, articles: null } : null;
  }

  const [categories, articles] = await Promise.all([
    fetchJson<{ data: KnowledgeBaseCategoryRecord[]; meta?: PaginatedResponse<KnowledgeBaseCategoryRecord>["meta"] }>(
      new URL(adminEndpoint("knowledgebase-categories")).toString(),
      cookieHeader,
      "/dashboard/content/knowledgebase",
    ),
    (async () => {
      const url = new URL(adminEndpoint("knowledgebase-articles"));
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        }
      });

      return fetchJson<{ data: KnowledgeBaseArticleRecord[]; meta?: PaginatedResponse<KnowledgeBaseArticleRecord>["meta"] }>(
        url.toString(),
        cookieHeader,
        "/dashboard/content/knowledgebase",
      );
    })(),
  ]);

  if (!categories) {
    return null;
  }

  return {
    categories: { data: categories.data, meta: categories.meta },
    articles: articles ? { data: articles.data, meta: articles.meta } : null,
  };
}

export async function fetchNetworkIncidentsFromCookies(
  cookieHeader: string,
  mode: AdminContentMode = "client",
  filters: Record<string, string | undefined> = {},
): Promise<PaginatedResponse<NetworkIncidentRecord> | NetworkIncidentRecord[] | null> {
  const url = new URL(
    mode === "admin" ? adminEndpoint("network-incidents") : clientPortalEndpoint("network-incidents"),
  );
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetchJson<{ data: NetworkIncidentRecord[]; meta?: PaginatedResponse<NetworkIncidentRecord>["meta"] }>(
    url.toString(),
    cookieHeader,
    mode === "admin" ? "/dashboard/content/incidents" : "/portal/network-status",
  );

  if (!response) {
    return null;
  }

  return mode === "admin" ? { data: response.data, meta: response.meta } : response.data;
}

export async function fetchPortalContentBlocksFromCookies(
  cookieHeader: string,
  mode: AdminContentMode = "client",
  filters: Record<string, string | undefined> = {},
): Promise<PaginatedResponse<PortalContentBlockRecord> | PortalContentBlockRecord[] | null> {
  const url = new URL(
    mode === "admin" ? adminEndpoint("portal-content-blocks") : clientPortalEndpoint("content-blocks"),
  );
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetchJson<{ data: PortalContentBlockRecord[]; meta?: PaginatedResponse<PortalContentBlockRecord>["meta"] }>(
    url.toString(),
    cookieHeader,
    mode === "admin" ? "/dashboard/content/website-security" : "/portal/website-security",
  );

  if (!response) {
    return null;
  }

  return mode === "admin" ? { data: response.data, meta: response.meta } : response.data;
}

export async function fetchPortalFooterLinksFromCookies(
  cookieHeader: string,
): Promise<PaginatedResponse<PortalFooterLinkRecord> | null> {
  const response = await fetchJson<{ data: PortalFooterLinkRecord[]; meta?: PaginatedResponse<PortalFooterLinkRecord>["meta"] }>(
    adminEndpoint("portal-footer-links"),
    cookieHeader,
    "/dashboard/content/footer-links",
  );

  return response ? { data: response.data, meta: response.meta } : null;
}
