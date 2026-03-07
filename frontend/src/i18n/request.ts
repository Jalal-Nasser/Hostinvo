import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  const requestLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  return {
    locale: requestLocale,
    messages: (await import(`../../messages/${requestLocale}.json`)).default,
  };
});
