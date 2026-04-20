import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import "../globals.css";
import { localeDirection, routing, type AppLocale } from "@/i18n/routing";
import { fetchPortalConfigFromCookies } from "@/lib/tenant-admin";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const defaultMetadataTitle = "Hostinvo";
const defaultMetadataDescription =
  "Hostinvo platform for tenant management, billing, and client operations.";

export async function generateMetadata(): Promise<Metadata> {
  const portalConfig = await fetchPortalConfigFromCookies(cookies().toString())
    .catch(() => null);
  const branding = portalConfig?.branding ?? null;
  const title =
    branding?.portal_name.trim() ||
    branding?.company_name.trim() ||
    defaultMetadataTitle;
  const description =
    branding?.portal_tagline.trim() ||
    branding?.company_name.trim() ||
    defaultMetadataDescription;
  const favicon = branding?.favicon_url || "/favicon.ico";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale } = params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const direction = localeDirection(locale as AppLocale);

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <NextIntlClientProvider locale={locale as AppLocale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
