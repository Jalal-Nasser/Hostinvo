"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";

function readCookie(name: string): string | null {
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

export function LogoutButton() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleLogout() {
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
          },
        );

        if (!response.ok) {
          setError(t("logoutError"));
          return;
        }

        router.replace(localePath(locale, "/auth/login"));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <div className="grid gap-2">
      <button
        className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={handleLogout}
        type="button"
      >
        {isPending ? t("loggingOut") : t("logoutButton")}
      </button>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
