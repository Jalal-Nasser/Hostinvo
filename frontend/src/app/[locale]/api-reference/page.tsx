import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";

const endpoints = [
  { method: "POST", path: "/api/v1/auth/login", desc: "Authenticate and receive access token" },
  { method: "POST", path: "/api/v1/auth/provider-register", desc: "Register a new provider account and tenant" },
  { method: "GET",  path: "/api/v1/auth/onboarding/status", desc: "Retrieve onboarding step completion status" },
  { method: "GET",  path: "/api/v1/clients", desc: "List all clients for the authenticated tenant" },
  { method: "POST", path: "/api/v1/clients", desc: "Create a new client record" },
  { method: "GET",  path: "/api/v1/invoices", desc: "List invoices with filters (status, date range)" },
  { method: "POST", path: "/api/v1/invoices", desc: "Create a new invoice" },
  { method: "POST", path: "/api/v1/invoices/{id}/pay", desc: "Trigger payment for an invoice" },
  { method: "GET",  path: "/api/v1/services", desc: "List provisioned services" },
  { method: "POST", path: "/api/v1/services/{id}/suspend", desc: "Suspend a service (queues provisioning job)" },
  { method: "POST", path: "/api/v1/services/{id}/terminate", desc: "Terminate a service" },
  { method: "GET",  path: "/api/v1/servers", desc: "List configured provisioning servers" },
  { method: "POST", path: "/api/v1/servers/{id}/test", desc: "Test server connectivity" },
  { method: "POST", path: "/api/v1/licensing/validate", desc: "Validate a license key and domain binding" },
  { method: "POST", path: "/api/v1/licensing/activate", desc: "Activate a license for an instance" },
  { method: "GET",  path: "/health", desc: "Platform health aggregate check" },
  { method: "GET",  path: "/metrics", desc: "Prometheus-format metrics (auth required)" },
];

const methodColors: Record<string, string> = {
  GET: "#28c840", POST: "#048dfe", PUT: "#ffbd2e", PATCH: "#ffbd2e", DELETE: "#ff5f57",
};

export default async function ApiReferencePage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;
  const isAr = locale === "ar";

  return (
    <MarketingShell currentPath="/api-reference" locale={locale}>
      <section className="relative overflow-hidden border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] via-[#0054c5] to-[#048dfe]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="section-label mb-5">{p.apiBadge}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">{p.apiTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#b3d4f5]">{p.apiDesc}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] px-5 py-3 text-sm text-white">
              <span className="font-bold">{isAr ? "الإصدار الأساسي:" : "Base URL:"}</span> <code className="font-mono text-[#93b4d8]">https://app.hostinvo.com/api/v1</code>
            </div>
            <div className="rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] px-5 py-3 text-sm text-white">
              <span className="font-bold">{isAr ? "المصادقة:" : "Auth:"}</span> <code className="font-mono text-[#93b4d8]">Bearer token (Sanctum)</code>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7faff] py-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          {/* Auth note */}
          <div className="mb-8 rounded-xl border border-[rgba(4,141,254,0.15)] bg-[#e0f0ff] px-6 py-4 text-sm text-[#0054c5]">
            <strong>{isAr ? "المصادقة:" : "Authentication:"}</strong> {isAr ? "أرسل رمز Bearer في رأس Authorization: Bearer {token}. احصل على رمزك عبر POST /api/v1/auth/login." : "Send Bearer token in Authorization header: Bearer {token}. Obtain via POST /api/v1/auth/login."}
          </div>

          {/* Endpoint list */}
          <div className="rounded-2xl border border-[rgba(4,141,254,0.12)] bg-white overflow-hidden">
            <div className="border-b border-[rgba(4,141,254,0.08)] bg-[#f7faff] px-6 py-3 grid grid-cols-[80px_1fr_1fr] gap-4 text-xs font-bold uppercase tracking-widest text-[#7a95b5]">
              <span>{isAr ? "الطريقة" : "Method"}</span>
              <span>{isAr ? "المسار" : "Endpoint"}</span>
              <span>{isAr ? "الوصف" : "Description"}</span>
            </div>
            {endpoints.map(({ method, path, desc }, i) => (
              <div key={path} className={`grid grid-cols-[80px_1fr_1fr] gap-4 items-center px-6 py-4 text-sm ${i % 2 === 0 ? "bg-white" : "bg-[#fafcff]"} border-b border-[rgba(4,141,254,0.06)]`}>
                <span className="rounded-md px-2.5 py-1 text-xs font-bold text-white text-center" style={{ background: methodColors[method] ?? "#7a95b5" }}>{method}</span>
                <code className="font-mono text-[#048dfe] text-xs">{path}</code>
                <span className="text-[#4a5e7a]">{desc}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-[#002d8e] p-8 text-center">
            <p className="text-lg font-bold text-white">{isAr ? "هل تبحث عن أدلة التكامل؟" : "Looking for integration guides?"}</p>
            <Link href={localePath(locale, "/guides")} className="btn-primary mt-4 inline-flex px-6 py-3 text-sm">{p.viewGuides}</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
