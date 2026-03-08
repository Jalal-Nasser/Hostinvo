"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ensureCsrfCookie, readCookie } from "@/components/provisioning/http";
import {
  dispatchProvisioningOperation,
  type ProvisioningOperation,
} from "@/lib/provisioning";

type ServiceOperationPanelProps = {
  serviceId: string;
  operations: ReadonlyArray<{
    value: ProvisioningOperation;
    label: string;
  }>;
  title: string;
  description: string;
  runningLabel: string;
  successLabel: string;
  errorLabel: string;
};

export function ServiceOperationPanel({
  serviceId,
  operations,
  title,
  description,
  runningLabel,
  successLabel,
  errorLabel,
}: ServiceOperationPanelProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [activeOperation, setActiveOperation] = useState<ProvisioningOperation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDispatch(operation: ProvisioningOperation) {
    setActiveOperation(operation);
    setMessage(null);
    setError(null);
    setIsPending(true);

    try {
      await ensureCsrfCookie();
      const xsrfToken = readCookie("XSRF-TOKEN");

      await dispatchProvisioningOperation(serviceId, operation, {}, xsrfToken);
      setMessage(successLabel.replace("{operation}", operation));
      router.refresh();
    } catch (dispatchError) {
      setError(
        dispatchError instanceof Error ? dispatchError.message : errorLabel,
      );
    } finally {
      setActiveOperation(null);
      setIsPending(false);
    }
  }

  return (
    <section className="glass-card p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{description}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        {operations.map((operation) => {
          const isRunning = activeOperation === operation.value && isPending;

          return (
            <button
              key={operation.value}
              type="button"
              onClick={() => handleDispatch(operation.value)}
              disabled={isPending}
              className="rounded-full border border-line bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning ? runningLabel : operation.label}
            </button>
          );
        })}
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl border border-line bg-[#f6fff6] px-4 py-3 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-2xl border border-line bg-[#fff5f2] px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      ) : null}
    </section>
  );
}
