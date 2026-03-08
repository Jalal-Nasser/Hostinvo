/**
 * Locale-aware formatting helpers for Hostinvo.
 *
 * Both helpers accept an AppLocale ("en" | "ar") and map it to the
 * appropriate BCP-47 locale tag before delegating to the Intl API.
 * This ensures that Arabic output uses Arabic-Indic digits and
 * RTL-compatible grouping separators by default.
 */

/** Map an AppLocale code to a BCP-47 locale tag. */
function toIntlLocale(locale: string): string {
    return locale === "ar" ? "ar-SA" : "en-US";
}

/**
 * Format a monetary amount using the Intl.NumberFormat API.
 *
 * @param amount   The numeric amount (in the smallest or full currency unit
 *                 depending on your data model — pass the display value).
 * @param currency ISO 4217 currency code, e.g. "USD" or "SAR".
 * @param locale   AppLocale ("en" | "ar").
 *
 * @example
 *   formatCurrency(1500, "USD", "en")  // "$1,500.00"
 *   formatCurrency(1500, "USD", "ar")  // "١٬٥٠٠٫٠٠ US$"
 */
export function formatCurrency(
    amount: number,
    currency: string,
    locale: string,
): string {
    return new Intl.NumberFormat(toIntlLocale(locale), {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format a date/timestamp using the Intl.DateTimeFormat API.
 *
 * @param date    A Date object, ISO-8601 string, or Unix timestamp (ms).
 * @param locale  AppLocale ("en" | "ar").
 * @param options Optional Intl.DateTimeFormatOptions to override defaults.
 *
 * @example
 *   formatDate("2026-03-09", "en")       // "Mar 9, 2026"
 *   formatDate("2026-03-09", "ar")       // "٩ مارس ٢٠٢٦"
 *   formatDate("2026-03-09", "en", { dateStyle: "full" }) // "Monday, March 9, 2026"
 */
export function formatDate(
    date: Date | string | number,
    locale: string,
    options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
    },
): string {
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(toIntlLocale(locale), options).format(d);
}

/**
 * Format a relative time label (e.g. "3 days ago") using Intl.RelativeTimeFormat.
 *
 * @param value   A negative number for the past or positive for the future.
 * @param unit    The time unit (e.g. "day", "hour", "minute").
 * @param locale  AppLocale ("en" | "ar").
 *
 * @example
 *   formatRelativeTime(-3, "day", "en")  // "3 days ago"
 *   formatRelativeTime(-3, "day", "ar")  // "منذ ٣ أيام"
 */
export function formatRelativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    locale: string,
): string {
    return new Intl.RelativeTimeFormat(toIntlLocale(locale), {
        numeric: "auto",
    }).format(value, unit);
}
