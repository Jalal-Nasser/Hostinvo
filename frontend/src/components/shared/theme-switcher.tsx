"use client";

import { useEffect, useState } from "react";

const COOKIE = "hv_theme";
const DARK = "dark";
const LIGHT = "light";

type Theme = typeof DARK | typeof LIGHT;

function getCookieTheme(): Theme {
  if (typeof document === "undefined") return DARK;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE}=`))
    ?.split("=")[1];

  return cookie === LIGHT ? LIGHT : DARK;
}

function getWorkspaceElement(): HTMLElement | null {
  return document.querySelector("main.dashboard-workspace");
}

function applyTheme(theme: Theme, el: HTMLElement) {
  if (theme === LIGHT) {
    el.classList.remove("dashboard-dark");
    el.classList.add("dashboard-light");
    return;
  }

  el.classList.remove("dashboard-light");
  el.classList.add("dashboard-dark");
}

type ThemeSwitcherProps = {
  initialTheme?: Theme;
};

export function ThemeSwitcher({ initialTheme = DARK }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const initial = getCookieTheme();
    setTheme(initial);

    const workspace = getWorkspaceElement();
    if (workspace) {
      applyTheme(initial, workspace);
    }
  }, []);

  function toggle() {
    const next = theme === DARK ? LIGHT : DARK;
    setTheme(next);
    document.cookie = `${COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;

    const workspace = getWorkspaceElement();
    if (workspace) {
      applyTheme(next, workspace);
    }
  }

  const isDark = theme === DARK;

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="theme-switcher-btn"
      onClick={toggle}
      title={isDark ? "Light mode" : "Dark mode"}
      type="button"
    >
      {isDark ? (
        <svg
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
          width="16"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.66 5.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
