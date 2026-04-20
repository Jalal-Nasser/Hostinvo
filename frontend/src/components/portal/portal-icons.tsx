type IconProps = {
  active?: boolean;
  className?: string;
};

function joinClasses(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

export function PortalBrandMark({ className }: { className?: string }) {
  return (
    <span
      className={joinClasses(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#57b0ff_0%,#257cff_55%,#1535b8_100%)] shadow-[0_10px_22px_rgba(7,17,42,0.34)]",
        className,
      )}
    >
      <span className="absolute inset-[5px] rounded-full border border-white/45" />
      <span className="h-2.5 w-2.5 rounded-full bg-white/95" />
      <span className="absolute -end-[2px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#7dc8ff]" />
    </span>
  );
}

export function PortalRailIcon({
  icon,
  active = false,
  className,
}: IconProps & {
  icon: "products" | "domains" | "website-security" | "support";
}) {
  const outline = active ? "#ffffff" : "#eef4ff";
  const accent = active ? "#39a0ff" : "#2d8cff";
  const accentSoft = active ? "#63b9ff" : "#4da0ff";
  const classes = joinClasses("h-8 w-8", className);

  switch (icon) {
    case "products":
      return (
        <svg className={classes} fill="none" viewBox="0 0 28 28">
          <path d="M7 15.2 14 18.8l7-3.6v4.6L14 23.3 7 19.8v-4.6Z" fill={accent} />
          <path
            d="m14 4.8-8 4.3 8 4.3 8-4.3-8-4.3Zm0 0v4.3m8-4.3v8.6l-8 4.3-8-4.3V8.9l8 4.3m0 0 8-4.3"
            stroke={outline}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "domains":
      return (
        <svg className={classes} fill="none" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="3.1" fill={accent} />
          <ellipse cx="14" cy="14" rx="10" ry="5.4" stroke={outline} strokeWidth="1.5" />
          <ellipse cx="14" cy="14" rx="5.6" ry="10" stroke={outline} strokeWidth="1.5" />
          <circle cx="14" cy="14" r="11" stroke={outline} strokeWidth="1.5" />
          <path
            d="M24.2 11.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Z"
            fill={accentSoft}
          />
        </svg>
      );
    case "website-security":
      return (
        <svg className={classes} fill="none" viewBox="0 0 28 28">
          <path d="M15.6 7.4 21.8 10v10.6l-6.2-2.7V7.4Z" fill={accent} />
          <path
            d="M7 8.2 13.6 5l6 2.4v13.5l-6-2.4L7 21.8V8.2Zm0 0 6.6 2.7m0 7.6V10.9M19.6 7.4l-6 3.5"
            stroke={outline}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "support":
      return (
        <svg className={classes} fill="none" viewBox="0 0 28 28">
          <path
            d="M12.2 8.1h6.6c2.7 0 4.8 2 4.8 4.5 0 1.7-.9 3.2-2.4 4l.1 4-3.2-2.1h-5.9c-2.6 0-4.7-2-4.7-4.5s2.1-5.9 4.7-5.9Z"
            fill={accent}
          />
          <path
            d="M9 10.2h6.4M9 13.6h4.2M7 19.3l-2.9 1.9.1-4.1a5 5 0 0 1-2.1-4c0-3.1 2.5-5.6 5.6-5.6h6.6c3.1 0 5.6 2.5 5.6 5.6 0 3.1-2.5 5.6-5.6 5.6H7Z"
            stroke={outline}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      );
  }
}

export function PortalActionIcon({
  icon,
  className,
}: {
  icon: "buy-domain" | "order-hosting" | "make-payment" | "get-support";
  className?: string;
}) {
  const classes = joinClasses("h-8 w-8", className);

  switch (icon) {
    case "buy-domain":
      return (
        <svg className={classes} fill="none" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="4" fill="#2e84ff" />
          <ellipse cx="14" cy="14" rx="9.6" ry="5.6" stroke="#ffffff" strokeWidth="1.7" />
          <ellipse cx="14" cy="14" rx="5.8" ry="10.1" stroke="#ffffff" strokeWidth="1.7" />
          <circle cx="14" cy="14" r="11" stroke="#dce8ff" strokeWidth="1.7" />
        </svg>
      );
    case "order-hosting":
      return (
        <svg className={classes} fill="none" viewBox="0 0 28 28">
          <path d="M7 15.2 14 18.8l7-3.6v4.6L14 23.3 7 19.8v-4.6Z" fill="#2e84ff" />
          <path
            d="m14 4.8-8 4.3 8 4.3 8-4.3-8-4.3Zm0 0v4.3m8-4.3v8.6l-8 4.3-8-4.3V8.9l8 4.3m0 0 8-4.3"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "make-payment":
      return (
        <svg className={classes} fill="none" viewBox="0 0 28 28">
          <path d="M14.5 6.3 21 10.1v8.2l-6.5 3.8-6.6-3.8v-8.2l6.6-3.8Z" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="m14.5 6.3 6.5 3.8-6.5 3.8-6.6-3.8 6.6-3.8Z" stroke="#dce8ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
          <path d="M18.5 12.7h-8" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="M15.7 15.9h-5.2" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="M17.3 9.8h2.9" stroke="#2e84ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
    case "get-support":
      return (
        <svg className={classes} fill="none" viewBox="0 0 28 28">
          <path
            d="M13.2 8.3h6.7c2.5 0 4.6 1.9 4.6 4.3 0 1.6-.8 3-2.2 3.8l.1 4.1-3.3-2.3h-5.9c-2.5 0-4.6-1.9-4.6-4.3s2.1-5.6 4.6-5.6Z"
            fill="#2e84ff"
          />
          <path
            d="M10 10.5h6.2M10 13.7h4.1M8 19l-3.2 2.1.1-4.1a5 5 0 0 1-2-4c0-3.1 2.5-5.5 5.5-5.5h6.7c3 0 5.5 2.4 5.5 5.5S18.1 19 15.1 19H8Z"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      );
  }
}

export function PortalLaptopIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={joinClasses("h-28 w-28 text-white/70", className)}
      fill="none"
      viewBox="0 0 120 120"
    >
      <path
        d="M22 30.5h54a4 4 0 0 1 4 4v34H18v-34a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path d="M10 77h78l7 9H3l7-9Z" fill="currentColor" opacity=".38" />
      <circle cx="50" cy="48" r="12" stroke="currentColor" strokeWidth="3" />
      <path d="M38 48h24M50 36c3.8 3.4 5.7 7.4 5.7 12 0 4.6-1.9 8.6-5.7 12M50 36c-3.8 3.4-5.7 7.4-5.7 12 0 4.6 1.9 8.6 5.7 12" stroke="currentColor" strokeWidth="2.3" />
    </svg>
  );
}

export function PortalSearchIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={joinClasses("h-28 w-28 text-white/72", className)}
      fill="none"
      viewBox="0 0 120 120"
    >
      <rect
        x="20"
        y="20"
        width="66"
        height="46"
        rx="6"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="m70 70 18 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="6"
      />
      <circle cx="55" cy="55" r="16" stroke="currentColor" strokeWidth="4" />
      <path d="M35 93h52" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

export function PortalSocialIcon({
  icon,
  className,
}: {
  icon: "facebook" | "twitter" | "linkedin";
  className?: string;
}) {
  const classes = joinClasses("h-3.5 w-3.5 text-[#dbe7ff]", className);

  switch (icon) {
    case "facebook":
      return (
        <svg className={classes} fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.4 21v-7.35h2.47l.37-2.87H13.4V8.96c0-.83.23-1.4 1.43-1.4h1.53V5a20.7 20.7 0 0 0-2.24-.11c-2.22 0-3.74 1.35-3.74 3.84v2.14H7.86v2.87h2.52V21h3.02Z" />
        </svg>
      );
    case "twitter":
      return (
        <svg className={classes} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.9 8.3c.01.16.01.33.01.49 0 5-3.8 10.76-10.76 10.76A10.7 10.7 0 0 1 2 17.73a7.57 7.57 0 0 0 5.58-1.56 3.8 3.8 0 0 1-3.54-2.64c.24.04.49.06.74.06.36 0 .72-.05 1.05-.14a3.8 3.8 0 0 1-3.05-3.73v-.05c.51.28 1.1.45 1.72.47a3.79 3.79 0 0 1-1.17-5.06 10.78 10.78 0 0 0 7.83 3.96 3.8 3.8 0 0 1 6.47-3.46 7.47 7.47 0 0 0 2.41-.92 3.8 3.8 0 0 1-1.67 2.1A7.63 7.63 0 0 0 20 6.2a8.16 8.16 0 0 1-1.9 1.96Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={classes} fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.94 8.5H3.78V20h3.16V8.5ZM5.36 3A1.84 1.84 0 1 0 5.4 6.68 1.84 1.84 0 0 0 5.36 3Zm14.86 9.9c0-3.03-1.62-4.44-3.78-4.44a3.27 3.27 0 0 0-2.95 1.63h-.04V8.5H10.3c.04 1.05 0 11.5 0 11.5h3.16v-6.42c0-.34.03-.68.13-.92.27-.67.88-1.37 1.9-1.37 1.34 0 1.88 1.03 1.88 2.54V20h3.16v-7.1Z" />
        </svg>
      );
  }
}
