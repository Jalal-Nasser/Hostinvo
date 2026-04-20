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

export function DomainHero({
  title,
  placeholder,
  transferLabel,
  searchLabel,
  transferHref,
  registerHref,
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
        "-ms-4 -me-4 md:-ms-6 md:-me-6 lg:-ms-0 lg:-me-0",
        "relative min-h-[270px] overflow-hidden ps-6 pe-6 pt-14 pb-12 md:ps-10 md:pe-10 lg:min-h-[302px]",
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_24%,rgba(16,36,107,0.12)_100%)]" />
      <div className="absolute start-0 top-0 h-full w-[182px] bg-[linear-gradient(135deg,#356ef2_0%,#356ef2_49%,transparent_49%)]" />
      <div className="absolute start-[126px] top-0 hidden h-[140px] w-[210px] bg-[linear-gradient(135deg,#1ca0f4_0%,#1ca0f4_62%,transparent_62%)] lg:block" />
      <div className="absolute end-0 top-0 h-full w-[182px] bg-[linear-gradient(225deg,#356ef2_0%,#356ef2_49%,transparent_49%)]" />
      <div className="absolute end-[126px] top-0 hidden h-[140px] w-[210px] bg-[linear-gradient(225deg,#1ca0f4_0%,#1ca0f4_62%,transparent_62%)] lg:block" />

      <div
        className="absolute hidden lg:block"
        style={{ insetInlineStart: "10rem", top: "1.7rem" }}
      >
        <PortalLaptopIllustration className="h-[188px] w-[188px] opacity-95" />
      </div>
      <div
        className="absolute hidden lg:block"
        style={{ insetInlineEnd: "9rem", top: "1.7rem" }}
      >
        <PortalSearchIllustration className="h-[188px] w-[188px] opacity-95" />
      </div>

      <div className="relative mx-auto max-w-[840px] text-center">
        <h1 className="text-[2.1rem] font-bold tracking-[-0.03em] text-white md:text-[3rem]">
          {title}
        </h1>

        <form
          className="mx-auto mt-8 flex max-w-[782px] flex-col gap-3 md:flex-row md:items-center"
          onSubmit={handleSearchSubmit}
        >
          <div className="flex min-h-[64px] w-full items-center overflow-hidden rounded-[999px] border border-[#dbeafe] bg-white shadow-[0_24px_48px_rgba(15,23,42,0.12)]">
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <svg
                className="h-[22px] w-[22px] shrink-0 text-[#2563eb]"
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
                className="h-12 min-w-0 flex-1 border-0 bg-transparent text-[16px] font-medium text-[#334155] caret-[#1d4ed8] outline-none placeholder:text-[#94a3b8]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                value={query}
              />
            </div>
            <div className="flex h-full items-center gap-[1px] rounded-[999px] bg-[#eff6ff] p-[2px]">
              <button
                className="min-w-[126px] rounded-[999px] bg-[#eff6ff] px-5 py-3 text-[16px] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
                onClick={handleTransferClick}
                type="button"
              >
                {transferLabel}
              </button>
              <button
                className="min-w-[120px] rounded-[999px] bg-[#2563eb] px-5 py-3 text-[16px] font-semibold text-white transition hover:bg-[#1d4ed8]"
                type="submit"
              >
                {searchLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
