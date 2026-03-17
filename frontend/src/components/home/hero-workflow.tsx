"use client";

import { useEffect, useState } from "react";

export type HeroWorkflowStep = {
  label: string;
  badge: string;
  icon: string;
};

interface HeroWorkflowProps {
  steps: HeroWorkflowStep[];
  isRtl?: boolean;
}

/**
 * HeroWorkflow — animated 5-step automation pipeline strip for the landing hero.
 * Cycles through steps left→right (RTL-aware) every 1.8s, then loops.
 * Pure CSS transitions — no external animation library required.
 */
export function HeroWorkflow({ steps, isRtl = false }: Readonly<HeroWorkflowProps>) {
  const [activeStep, setActiveStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
    }, 1800);
    return () => clearInterval(timer);
  }, [steps.length]);

  // Avoid hydration mismatch — render placeholder until client mounts
  if (!mounted) {
    return (
      <div
        className="mx-auto mt-10 h-[108px] w-full max-w-2xl rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)]"
        aria-hidden
      />
    );
  }

  const progressPct =
    steps.length > 1 ? (activeStep / (steps.length - 1)) * 100 : 0;

  return (
    <div
      className="relative mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.22)] backdrop-blur-sm"
      role="presentation"
      aria-label="Automation workflow preview"
    >
      {/* inner top-edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-[rgba(4,141,254,0.28)] to-transparent"
        aria-hidden
      />

      <div className="relative flex items-start justify-between">
        {/* Background track */}
        <div
          className="pointer-events-none absolute top-[19px] h-px w-full bg-[rgba(255,255,255,0.07)]"
          aria-hidden
        />
        {/* Animated progress fill */}
        <div
          className="pointer-events-none absolute top-[19px] h-px transition-[width] duration-700 ease-in-out"
          style={{
            width: `${progressPct}%`,
            background: "linear-gradient(90deg,#048dfe 0%,#0054c5 100%)",
            boxShadow: "0 0 6px 1px rgba(4,141,254,0.45)",
            ...(isRtl ? { right: 0 } : { left: 0 }),
          }}
          aria-hidden
        />

        {steps.map((step, i) => {
          const isPast    = i < activeStep;
          const isCurrent = i === activeStep;
          const isFuture  = i > activeStep;

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center gap-1.5">

              {/* Circle node */}
              <div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-base transition-all duration-500",
                  isCurrent
                    ? "scale-110 border-[#048dfe] bg-[#048dfe] shadow-[0_0_0_4px_rgba(4,141,254,0.18),0_0_18px_rgba(4,141,254,0.65)]"
                    : isPast
                    ? "border-[#0054c5] bg-[rgba(0,84,197,0.35)]"
                    : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]",
                ].join(" ")}
              >
                <span
                  className={["select-none transition-opacity duration-500", isFuture ? "opacity-25" : "opacity-100"].join(" ")}
                >
                  {step.icon}
                </span>
              </div>

              {/* Step label */}
              <span
                className={[
                  "max-w-[72px] text-center text-[11px] font-medium leading-[1.35] transition-colors duration-500",
                  isCurrent ? "text-white" : isPast ? "text-[#6a96bf]" : "text-[#2d4a66]",
                ].join(" ")}
              >
                {step.label}
              </span>

              {/* Status badge */}
              <span
                className={[
                  "rounded-full px-2 py-px text-[9px] font-semibold uppercase tracking-[0.06em] transition-all duration-500",
                  isCurrent
                    ? "bg-[rgba(4,141,254,0.22)] text-[#7dd3fc] ring-1 ring-[rgba(4,141,254,0.35)]"
                    : isPast
                    ? "bg-[rgba(255,255,255,0.05)] text-[#3d5a78]"
                    : "bg-transparent text-[#1e3a52]",
                ].join(" ")}
              >
                {step.badge}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
