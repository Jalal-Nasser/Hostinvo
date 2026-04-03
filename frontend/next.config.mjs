import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function normalizeUrl(value) {
  return value ? value.replace(/\/+$/, "") : value;
}

const marketingUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_MARKETING_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

const portalUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_PORTAL_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

const publicApiUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
);

const publicApiBaseUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? `${publicApiUrl}/api/v1`,
);

const internalApiBaseUrl = normalizeUrl(
  process.env.INTERNAL_API_BASE_URL ?? publicApiBaseUrl,
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_MARKETING_URL: marketingUrl,
    NEXT_PUBLIC_PORTAL_URL: portalUrl,
    NEXT_PUBLIC_API_URL: publicApiUrl,
    NEXT_PUBLIC_API_BASE_URL: publicApiBaseUrl,
    INTERNAL_API_BASE_URL: internalApiBaseUrl,
  },
};

export default withNextIntl(nextConfig);
