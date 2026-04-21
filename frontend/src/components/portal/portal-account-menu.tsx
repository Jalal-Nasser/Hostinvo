"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { localePath } from "@/lib/auth";

type PortalAccountMenuProps = {
  locale: string;
  buttonClass?: string;
  label: string;
};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function PortalAccountMenu({ locale, buttonClass, label }: PortalAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loginLabel = locale === "ar" ? "تسجيل الدخول" : "Login";
  const registerLabel = locale === "ar" ? "إنشاء حساب" : "Register";
  const forgotPasswordLabel = locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot Password?";

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);

    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={joinClasses(buttonClass, "inline-flex items-center gap-1.5 px-2 py-1 text-[13px] font-medium text-white transition hover:text-white/80")}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="inline-flex items-center justify-center">
           <svg className="h-[15px] w-[15px]" fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
           </svg>
        </span>
        <span>{label}</span>
        <svg
          aria-hidden="true"
          className={joinClasses("ms-0.5 h-3 w-3 transition", open ? "rotate-180" : "")}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open ? (
        <div className="absolute end-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded shadow-lg bg-[#2f4368]/95 backdrop-blur-sm border-t-2 border-[#1681ff]">
          <div className="flex flex-col py-2">
            <Link
              href={localePath(locale, "/auth/login")}
              className="group flex items-center gap-3 px-5 py-2.5 text-[13px] text-white transition hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <svg aria-hidden="true" className="h-[15px] w-[15px] text-white/70 transition group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>{loginLabel}</span>
            </Link>

            <Link
              href={localePath(locale, "/auth/register")}
              className="group flex items-center gap-3 px-5 py-2.5 text-[13px] text-white transition hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <svg aria-hidden="true" className="h-[15px] w-[15px] text-white/70 transition group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>{registerLabel}</span>
            </Link>

            <Link
              href={localePath(locale, "/auth/forgot-password")}
              className="group flex items-center gap-3 px-5 py-2.5 text-[13px] text-white transition hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <svg aria-hidden="true" className="h-[15px] w-[15px] text-white/70 transition group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{forgotPasswordLabel}</span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
