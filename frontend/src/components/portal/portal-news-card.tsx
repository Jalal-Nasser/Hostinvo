type PortalNewsItem = {
  id: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
};

type PortalNewsCardProps = {
  title: string;
  items?: PortalNewsItem[];
};

export function PortalNewsCard({
  title,
  items = [],
}: PortalNewsCardProps) {
  const featuredItem = items[0] ?? {
    id: "demo-news",
    title: "Platform Updates Completed",
    excerpt:
      "Dear valued clients, Over the past few days, our client portal was temporarily unavailable due to an unexpected backend issue that required in-depth maintenance and reconfiguration. This downtime affected access to billing, service management, and support ticket functions. We're happy to confirm that everything is now fully restored — the platform is stable again and all core services are operating normally.",
    publishedAt: "Oct 12th",
  };

  return (
    <section id="news" className="mx-auto mt-16 max-w-[960px]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-normal tracking-[-0.02em] text-white md:text-[22px]">
          {title}
        </h2>
        <span className="inline-flex h-5 w-5 items-center justify-center text-[#dbe6fb]">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h12a2 2 0 0 1 2 2v13l-4-2.8L12 19l-4-2.8L4 19V6a2 2 0 0 1 2-2Z" />
          </svg>
        </span>
      </div>

      <article className="rounded-[4px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(102,118,151,0.16)_0%,rgba(89,103,133,0.14)_100%)] px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-2 text-[13px] text-[#eef3ff]">
          <span className="inline-flex h-3 w-3 items-center justify-center text-[#dce6ff]">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h12v14H6zM8 2h2v4H8zm6 0h2v4h-2z" />
            </svg>
          </span>
          <span>{featuredItem.publishedAt}</span>
        </div>
        <h3 className="mt-4 text-[24px] font-normal tracking-[-0.02em] text-white">
          {featuredItem.title}
        </h3>
        {featuredItem.excerpt ? (
          <p className="mt-3 max-w-[900px] text-[14px] leading-8 text-[#d9e2f5]">
            {featuredItem.excerpt}
          </p>
        ) : null}
        <button
          className="mt-6 inline-flex min-h-[36px] items-center justify-center rounded-[2px] bg-[#dbe5ff] px-4 text-[13px] font-medium text-[#2e5fc7]"
          type="button"
        >
          Read More
        </button>
      </article>
    </section>
  );
}
