"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  PortalLaptopIllustration,
  PortalSearchIllustration,
} from "@/components/portal/portal-icons";
import { portalTheme } from "@/components/portal/portal-theme";

type DomainHeroProps = {
  kicker: string;
  title: string;
  description: string;
  placeholder: string;
  transferLabel: string;
  searchLabel: string;
  suggestedExtensionsLabel: string;
  transferHref: string;
  registerHref: string;
  isRtl: boolean;
};

const suggestedExtensions = [".com", ".net", ".org", ".sa"];

export function DomainHero({
  kicker,
  title,
  description,
  placeholder,
  transferLabel,
  searchLabel,
  suggestedExtensionsLabel,
  transferHref,
  registerHref,
  isRtl,
}: DomainHeroProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function buildTargetUrl(basePath: string): string {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return basePath;
    }

    const params = new URLSearchParams({ query: trimmedQuery });

    return `${basePath}?${params.toString()}`;
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildTargetUrl(registerHref));
  }

  function handleTransferClick() {
    router.push(buildTargetUrl(transferHref));
  }

  return (
    <section
      className={[
        portalTheme.heroClass,
        "relative overflow-hidden ps-6 pe-6 py-10 md:ps-10 md:pe-10 md:py-12",
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_36%,rgba(8,25,82,0.16)_100%)]" />
      <div
        className="absolute hidden lg:block"
        style={{ insetInlineStart: "2.25rem", top: "1.4rem" }}
      >
        <PortalLaptopIllustration className="h-24 w-24 opacity-80" />
      </div>
      <div
        className="absolute hidden lg:block"
        style={{ insetInlineEnd: "2.25rem", top: "1.6rem" }}
      >
        <PortalSearchIllustration className="h-24 w-24 opacity-80" />
      </div>

      <div className="relative ms-auto me-auto max-w-[760px] text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/72">{kicker}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white md:text-[2.45rem]">
          {title}
        </h1>
        <p className="ms-auto me-auto mt-3 max-w-[560px] text-sm leading-7 text-[#dfe8ff]">
          {description}
        </p>

        <form
          className="ms-auto me-auto mt-7 flex max-w-[620px] flex-col gap-3 md:flex-row md:items-center"
          onSubmit={handleSearchSubmit}
        >
          <div className={[portalTheme.inputShellClass, "min-w-0 flex-1 ps-3 pe-2"].join(" ")}>
            <svg
              className="h-[18px] w-[18px] shrink-0 text-[#7591c6]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="m21 21-4.35-4.35M10.75 18a7.25 7.25 0 1 0 0-14.5 7.25 7.25 0 0 0 0 14.5Z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <input
              className="h-11 w-full border-0 bg-transparent ps-3 pe-3 text-[15px] text-[#13254a] outline-none placeholder:text-[#8aa1c7]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              value={query}
            />
          </div>

          <div
            className={[
              "flex items-center gap-2 md:shrink-0",
              isRtl ? "md:flex-row-reverse" : "",
            ].join(" ")}
          >
            <button className={portalTheme.secondaryButtonClass} onClick={handleTransferClick} type="button">
              {transferLabel}
            </button>
            <button className={portalTheme.primaryButtonClass} type="submit">
              {searchLabel}
            </button>
          </div>
        </form>

        <div
          className={[
            "mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-white/82",
            isRtl ? "md:flex-row-reverse" : "",
          ].join(" ")}
        >
          <span className="text-[#dce7ff]/84">{suggestedExtensionsLabel}</span>
          {suggestedExtensions.map((extension) => (
            <button
              key={extension}
              className="rounded-full border border-white/18 bg-white/8 ps-3 pe-3 py-1 text-sm font-medium text-white/92 transition hover:bg-white/12"
              onClick={() => setQuery((current) => `${current.replace(/\.[^.]*$/, "").trim() || "example"}${extension}`)}
              type="button"
            >
              {extension}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
