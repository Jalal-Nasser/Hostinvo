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
};

export type WorkspaceMode = "admin" | "portal";

const publicApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

const internalApiBaseUrl =
  process.env.INTERNAL_API_BASE_URL ?? publicApiBaseUrl;

export const apiBaseUrl =
  typeof window === "undefined" ? internalApiBaseUrl : publicApiBaseUrl;

export const backendOrigin = new URL(apiBaseUrl).origin;

export const sessionCookieName =
  process.env.NEXT_PUBLIC_SESSION_COOKIE ?? "hostinvo_session";

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
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
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

export function hasAnyPermission(
  user: AuthenticatedUser | null,
  permissions: string[],
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function canAccessAdminWorkspace(user: AuthenticatedUser | null): boolean {
  return hasPermission(user, "dashboard.view");
}

export function canAccessClientPortal(user: AuthenticatedUser | null): boolean {
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
