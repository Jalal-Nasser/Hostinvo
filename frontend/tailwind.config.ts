import type { Config } from "tailwindcss";
import rtl from "tailwindcss-rtl";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./messages/**/*.json",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        line: "var(--line)",
        accent: "var(--accent)",
        accentSoft: "var(--accent-soft)",
        muted: "var(--muted)",
        // Hostinvo brand tokens
        brandBlue: "var(--brand-blue)",
        brandBlueDark: "var(--brand-blue-dark)",
        brandNavy: "var(--brand-navy)",
        brandAccent: "var(--brand-accent)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #048dfe 0%, #036deb 50%, #0054c5 100%)",
        "hero-gradient": "linear-gradient(135deg, #002d8e 0%, #0054c5 40%, #048dfe 100%)",
        "card-gradient": "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.8) 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
        "fade-in": "fadeIn 0.4s ease-out both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [rtl],
};
export default config;
