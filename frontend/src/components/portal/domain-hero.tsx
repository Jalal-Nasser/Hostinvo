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
          <div className="flex min-h-[60px] w-full items-center overflow-hidden rounded-[6px] border-[6px] border-white bg-white shadow-[0_8px_18px_rgba(8,20,58,0.22)]">
            <div className="flex min-w-0 flex-1 items-center ps-4">
              <svg
                className="h-[22px] w-[22px] shrink-0 text-[#2d6df0]"
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
                className="h-12 w-full border-0 bg-transparent ps-3 pe-3 text-[16px] !text-[#34425e] caret-[#1a65ff] outline-none placeholder:!text-[#a6b0c0]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                value={query}
              />
            </div>
            <div className="flex h-full items-stretch gap-[1px] bg-white pe-[1px]">
              <button
                className="min-w-[126px] bg-[#dce7ff] px-5 text-[16px] font-semibold text-[#3568d4]"
                onClick={handleTransferClick}
                type="button"
              >
                {transferLabel}
              </button>
              <button
                className="min-w-[120px] bg-[linear-gradient(180deg,#4387ff_0%,#3371ea_100%)] px-5 text-[16px] font-semibold text-white"
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
