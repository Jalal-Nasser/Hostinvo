"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import type { PlatformPlan, PlatformPlansPayload } from "@/lib/platform-plans";
import { updatePlatformPlans } from "@/lib/platform-plans";

type PlanEditorProps = {
  initial: PlatformPlansPayload;
};

type PlanDraft = PlatformPlan & { id: string };

function normalizePlan(plan: PlatformPlan): PlanDraft {
  return {
    ...plan,
    monthly_price: plan.monthly_price ?? 0,
    max_services: plan.max_services ?? 0,
    activation_limit: plan.activation_limit ?? 0,
    duration_days: plan.duration_days ?? 0,
    id: plan.key,
  };
}

export function PlanEditor({ initial }: PlanEditorProps) {
  const t = useTranslations("Dashboard");
  const [pricingNote, setPricingNote] = useState(initial.pricing_note ?? "");
  const [plans, setPlans] = useState<PlanDraft[]>(
    initial.plans.map((plan) => normalizePlan(plan)),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [isPending, startTransition] = useTransition();

  const planOrder = useMemo(
    () => ["free_trial", "starter", "growth", "professional"],
    [],
  );

  const sortedPlans = useMemo(() => {
    const order = new Map(planOrder.map((key, index) => [key, index]));
    return [...plans].sort((a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99));
  }, [plans, planOrder]);

  const updatePlan = (key: string, patch: Partial<PlanDraft>) => {
    setPlans((current) =>
      current.map((plan) => (plan.key === key ? { ...plan, ...patch } : plan)),
    );
  };

  const handleSave = () => {
    setStatus(null);
    setErrors(null);

    const payload: PlatformPlansPayload = {
      pricing_note: pricingNote.trim() === "" ? null : pricingNote.trim(),
      plans: plans.map((plan) => ({
        key: plan.key,
        label: plan.label.trim(),
        monthly_price: plan.is_trial ? null : Number(plan.monthly_price || 0),
        max_clients: Number(plan.max_clients || 0),
        max_services: Number(plan.max_services || 0),
        activation_limit: Number(plan.activation_limit || 0),
        duration_days: plan.is_trial ? Number(plan.duration_days || 0) : null,
        is_trial: plan.is_trial,
      })),
    };

    startTransition(async () => {
      const response = await updatePlatformPlans(payload);

      if (!response.error) {
        setStatus(t("plansSaved"));
        setErrors(null);
        return;
      }

      setStatus(response.error);
      setErrors(response.errors ?? null);
    });
  };

  return (
    <div className="space-y-6">
      <section className="dashboard-shell-surface">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="dashboard-kicker">{t("plansKicker")}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a1628]">
              {t("plansEditorTitle")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#6b7280]">
              {t("plansEditorDescription")}
            </p>
          </div>
          <button
            className="btn-primary h-11 px-6 text-sm"
            onClick={handleSave}
            type="button"
          >
            {isPending ? t("plansSaving") : t("plansSave")}
          </button>
        </div>
        <div className="mt-6">
          <label className="text-sm font-semibold text-[#123055]">
            {t("plansNoteLabel")}
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#036deb]"
            value={pricingNote}
            onChange={(event) => setPricingNote(event.target.value)}
            placeholder={t("plansNotePlaceholder")}
          />
        </div>
        {status ? (
          <p className="mt-4 text-sm font-semibold text-[#036deb]">{status}</p>
        ) : null}
        {errors?.general ? (
          <p className="mt-3 text-sm text-red-600">{errors.general[0]}</p>
        ) : null}
      </section>

      <section className="grid gap-5">
        {sortedPlans.map((plan) => (
          <div key={plan.id} className="glass-card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="dashboard-kicker">{t("planLabel")}</p>
                <h3 className="mt-2 text-xl font-semibold text-[#0a1628]">
                  {plan.label}
                </h3>
              </div>
              <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-4 py-1 text-xs font-semibold text-[#036deb]">
                {plan.key.replace("_", " ")}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-semibold text-[#123055]">
                {t("planLabelName")}
                <input
                  className="mt-2 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#036deb]"
                  value={plan.label}
                  onChange={(event) => updatePlan(plan.key, { label: event.target.value })}
                />
              </label>

              <label className="text-sm font-semibold text-[#123055]">
                {t("planMonthlyPrice")}
                <input
                  className="mt-2 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#036deb]"
                  value={plan.monthly_price}
                  type="number"
                  min={0}
                  step={1}
                  disabled={plan.is_trial}
                  onChange={(event) =>
                    updatePlan(plan.key, { monthly_price: Number(event.target.value) })
                  }
                />
              </label>

              <label className="text-sm font-semibold text-[#123055]">
                {t("planMaxClients")}
                <input
                  className="mt-2 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#036deb]"
                  value={plan.max_clients}
                  type="number"
                  min={0}
                  step={1}
                  onChange={(event) =>
                    updatePlan(plan.key, { max_clients: Number(event.target.value) })
                  }
                />
              </label>

              <label className="text-sm font-semibold text-[#123055]">
                {t("planMaxServices")}
                <input
                  className="mt-2 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#036deb]"
                  value={plan.max_services}
                  type="number"
                  min={0}
                  step={1}
                  onChange={(event) =>
                    updatePlan(plan.key, { max_services: Number(event.target.value) })
                  }
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-semibold text-[#123055]">
                {t("planActivationLimit")}
                <input
                  className="mt-2 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#036deb]"
                  value={plan.activation_limit}
                  type="number"
                  min={0}
                  step={1}
                  onChange={(event) =>
                    updatePlan(plan.key, { activation_limit: Number(event.target.value) })
                  }
                />
              </label>

              <label className="text-sm font-semibold text-[#123055]">
                {t("planDurationDays")}
                <input
                  className="mt-2 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#0a1628] outline-none transition focus:border-[#036deb]"
                  value={plan.duration_days}
                  type="number"
                  min={0}
                  step={1}
                  disabled={!plan.is_trial}
                  onChange={(event) =>
                    updatePlan(plan.key, { duration_days: Number(event.target.value) })
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
