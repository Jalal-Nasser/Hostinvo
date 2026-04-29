"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { apiBaseUrl, ensureCsrfCookie, readBrowserCookie } from "@/lib/auth";

type WhmcsImportStatus = "pending" | "running" | "completed" | "failed";

export type WhmcsImportRecord = {
  id: string;
  tenant_id: string;
  status: WhmcsImportStatus;
  message: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type WhmcsImportPanelProps = {
  initialImport: WhmcsImportRecord | null;
};

const runningStatuses: WhmcsImportStatus[] = ["pending", "running"];

function statusLabel(status: WhmcsImportStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function fetchLatestImport() {
  const response = await fetch(`${apiBaseUrl}/admin/whmcs/import`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load WHMCS import status.");
  }

  const payload = (await response.json()) as {
    data: { import: WhmcsImportRecord | null };
  };

  return payload.data.import;
}

export function WhmcsImportPanel({ initialImport }: WhmcsImportPanelProps) {
  const [latestImport, setLatestImport] = useState<WhmcsImportRecord | null>(initialImport);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRunning = latestImport ? runningStatuses.includes(latestImport.status) : false;

  const statusTone = useMemo(() => {
    if (!latestImport) {
      return "border-border bg-background text-foreground";
    }

    if (latestImport.status === "completed") {
      return "border-emerald-300 bg-background text-foreground";
    }

    if (latestImport.status === "failed") {
      return "border-rose-300 bg-background text-foreground";
    }

    return "border-blue-300 bg-background text-foreground";
  }, [latestImport]);

  const statusDot = useMemo(() => {
    if (latestImport?.status === "completed") {
      return "bg-emerald-500";
    }

    if (latestImport?.status === "failed") {
      return "bg-rose-500";
    }

    return "bg-[#036deb]";
  }, [latestImport?.status]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      try {
        setLatestImport(await fetchLatestImport());
      } catch {
        window.clearInterval(interval);
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError(null);
    setIsSubmitting(true);

    try {
      await ensureCsrfCookie();

      const xsrfToken = readBrowserCookie("XSRF-TOKEN");
      const response = await fetch(`${apiBaseUrl}/admin/whmcs/import`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
        },
        body: JSON.stringify({
          host: formData.get("host"),
          port: Number(formData.get("port") || 3306),
          database: formData.get("database"),
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });

      const payload = (await response.json()) as {
        data?: { import?: WhmcsImportRecord; message?: string };
        errors?: Array<{ message?: string }>;
      };

      if (!response.ok) {
        throw new Error(payload.errors?.[0]?.message ?? "Unable to start WHMCS import.");
      }

      setLatestImport(payload.data?.import ?? null);
      form.reset();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to start WHMCS import.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <section className="glass-card p-5">
        <div className="mb-5">
          <p className="dashboard-kicker">Import</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">WHMCS database</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the source WHMCS database credentials. The password is only sent to the queued import job.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px]">
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              DB host
              <input
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-[#036deb] focus:ring-2 focus:ring-[#036deb]/15"
                name="host"
                placeholder="127.0.0.1"
                required
                type="text"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              Port
              <input
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-[#036deb] focus:ring-2 focus:ring-[#036deb]/15"
                defaultValue="3306"
                max={65535}
                min={1}
                name="port"
                required
                type="number"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-medium text-foreground">
            Database
            <input
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-[#036deb] focus:ring-2 focus:ring-[#036deb]/15"
              name="database"
              placeholder="whmcs"
              required
              type="text"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              Username
              <input
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-[#036deb] focus:ring-2 focus:ring-[#036deb]/15"
                name="username"
                required
                type="text"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              Password
              <input
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-[#036deb] focus:ring-2 focus:ring-[#036deb]/15"
                name="password"
                type="password"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-300 bg-background px-3 py-2 text-sm font-medium text-rose-600">
              {error}
            </p>
          ) : null}

          <div>
            <button
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || isRunning}
              type="submit"
            >
              {isSubmitting || isRunning ? (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              ) : null}
              {isSubmitting ? "Starting import" : isRunning ? "Import running" : "Start Import"}
            </button>
          </div>
        </form>
      </section>

      <section className="glass-card p-5">
        <p className="dashboard-kicker">Status</p>
        <h2 className="mt-1 text-xl font-semibold text-foreground">Import status</h2>

        <div className={`mt-5 rounded-xl border px-4 py-4 ${statusTone}`}>
          {latestImport ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {isRunning ? (
                  <span
                    aria-hidden="true"
                    className={`h-3 w-3 animate-pulse rounded-full ${statusDot}`}
                  />
                ) : latestImport.status === "completed" || latestImport.status === "failed" ? (
                  <span aria-hidden="true" className={`h-3 w-3 rounded-full ${statusDot}`} />
                ) : null}
                <span className="text-sm font-semibold">{statusLabel(latestImport.status)}</span>
              </div>
              <p className="text-sm">
                {latestImport.status === "completed"
                  ? "Import completed successfully"
                  : latestImport.message ?? "No status message available."}
              </p>
              {latestImport.updated_at ? (
                <p className="text-xs opacity-75">
                  Last updated {new Date(latestImport.updated_at).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm">No WHMCS import has been started yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
