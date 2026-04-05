export type AuthenticatedUser = {
  id: string;
  tenant_id: string | null;
  name: string;
  email: string;
  locale: string;
  is_active: boolean;
  last_login_at: string | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    status: string;
    default_locale: string;
  } | null;
  active_tenant?: {
    id: string;
    name: string;
    slug: string;
    status: string;
    default_locale: string;
  } | null;
  roles: Array<{
    id: number;
    name: string;
    display_name: string;
  }>;
  permissions: Array<{
    id: number;
    name: string;
    display_name: string;
  }>;
  impersonation?: {
    active: boolean;
    started_at?: string | null;
    impersonator?: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
};

export type WorkspaceMode = "admin" | "portal";

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export const publicApiBaseUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1",
);

const internalApiBaseUrl = normalizeUrl(
  process.env.INTERNAL_API_BASE_URL ?? publicApiBaseUrl,
);

export const marketingUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3000",
);

export const portalUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_PORTAL_URL ?? marketingUrl,
);

export const apiBaseUrl =
  typeof window === "undefined" ? internalApiBaseUrl : publicApiBaseUrl;

export const backendOrigin = new URL(apiBaseUrl).origin;

export const sessionCookieName =
  process.env.NEXT_PUBLIC_SESSION_COOKIE ?? "hostinvo_session";

export function statefulApiHeaders(
  cookieHeader: string,
  refererPath = "/dashboard",
): HeadersInit {
  const normalizedRefererPath = refererPath.startsWith("/")
    ? refererPath
    : `/${refererPath}`;

  return {
    Accept: "application/json",
    Cookie: cookieHeader,
    Origin: portalUrl,
    Referer: `${portalUrl}${normalizedRefererPath}`,
    "X-Requested-With": "XMLHttpRequest",
  };
}

export function localePath(locale: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  return `/${locale}${normalized}`;
}

export async function getAuthenticatedUserFromCookies(
  cookieHeader: string,
): Promise<AuthenticatedUser | null> {
  if (!cookieHeader.includes(`${sessionCookieName}=`)) {
    return null;
  }

  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    cache: "no-store",
    headers: statefulApiHeaders(cookieHeader),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: AuthenticatedUser };

  return payload.data;
}

export function hasPermission(
  user: AuthenticatedUser | null,
  permission: string,
): boolean {
  if (!user) {
    return false;
  }

  return user.permissions.some((item) => item.name === permission);
}

export function hasRole(user: AuthenticatedUser | null, roleName: string): boolean {
  if (!user) {
    return false;
  }

  return user.roles.some((role) => role.name === roleName);
}

export function hasAnyPermission(
  user: AuthenticatedUser | null,
  permissions: string[],
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function hasActiveTenantContext(user: AuthenticatedUser | null): boolean {
  return Boolean(user?.active_tenant?.id ?? user?.tenant?.id ?? user?.tenant_id);
}

export function isPlatformOwnerContext(user: AuthenticatedUser | null): boolean {
  return hasRole(user, "super_admin") && !hasActiveTenantContext(user);
}

export function canAccessAdminWorkspace(user: AuthenticatedUser | null): boolean {
  return hasPermission(user, "dashboard.view");
}

export function canAccessClientPortal(user: AuthenticatedUser | null): boolean {
  if (hasRole(user, "super_admin")) {
    return hasPermission(user, "client.portal.access") && hasActiveTenantContext(user);
  }

  return hasPermission(user, "client.portal.access");
}

export function defaultWorkspacePath(
  locale: string,
  user: AuthenticatedUser | null,
): string {
  if (canAccessAdminWorkspace(user)) {
    return localePath(locale, "/dashboard");
  }

  if (canAccessClientPortal(user)) {
    return localePath(locale, "/portal");
  }

  return localePath(locale, "/dashboard");
}
