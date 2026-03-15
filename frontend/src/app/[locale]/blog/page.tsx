import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { getLaunchContent } from "@/lib/launch-content";

export default async function BlogPage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;
  const isAr = locale === "ar";

  const categories = isAr
    ? ["تحديثات المنتج", "تقنيات الاستضافة", "أدلة تشغيلية", "أخبار الصناعة", "الأمان"]
    : ["Product Updates", "Hosting Technology", "Operations Guides", "Industry News", "Security"];

  return (
    <MarketingShell currentPath="/blog" locale={locale}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] via-[#0054c5] to-[#048dfe]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="section-label mb-5">{p.blogBadge}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">{p.blogTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#b3d4f5]">{p.blogDesc}</p>
        </div>
      </section>

      <section className="bg-[#f7faff] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Categories */}
          <div className="mb-10 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span key={cat} className="rounded-full border border-[rgba(4,141,254,0.2)] bg-white px-4 py-1.5 text-sm font-medium text-[#4a5e7a] cursor-pointer hover:bg-[#e0f0ff] hover:text-[#048dfe] transition-colors">{cat}</span>
            ))}
          </div>

          {/* Coming soon */}
          <div className="rounded-2xl border border-[rgba(4,141,254,0.12)] bg-white p-16 text-center">
            <span className="text-5xl">✍️</span>
            <h2 className="mt-6 text-xl font-extrabold text-[#0a1628]">{isAr ? "المدونة قريباً" : "Blog coming soon"}</h2>
            <p className="mt-3 text-[#4a5e7a]">{p.blogComingSoon}</p>
            <div className="mt-8 mx-auto max-w-sm flex gap-2">
              <input className="flex-1 rounded-xl border border-[rgba(4,141,254,0.15)] bg-[#f7faff] px-4 py-3 text-sm outline-none focus:border-[#048dfe]" placeholder={isAr ? "بريدك الإلكتروني" : "Your email"} type="email" />
              <button className="btn-primary px-5 py-3 text-sm shrink-0">{isAr ? "اشترك" : "Subscribe"}</button>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
