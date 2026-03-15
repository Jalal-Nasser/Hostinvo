import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { getLaunchContent } from "@/lib/launch-content";

const docsCategories = [
  {
    groupKey: "docsGettingStarted" as const,
    color: "#048dfe",
    items: [
      { title: "Introduction", desc: "What Hostinvo is, how the platform is structured, and how to navigate this documentation." },
      { title: "Quick Start", desc: "Get a development environment running in under 10 minutes with Docker Compose." },
      { title: "Environment Variables", desc: "Complete reference for all required and optional environment variables for backend and frontend." },
      { title: "First Provider Setup", desc: "Create a provider account, configure your company, connect a server, and publish your first product." },
      { title: "Onboarding Wizard", desc: "Step-by-step walkthrough of the 4-step provider onboarding flow built into the platform." },
    ],
  },
  {
    groupKey: "docsPlatform" as const,
    color: "#0054c5",
    items: [
      { title: "Tenant Architecture", desc: "How multi-tenancy works — shared-schema isolation, tenant_id scoping, and the global TenantScope." },
      { title: "Billing & Invoicing", desc: "Invoice lifecycle, recurring billing cycles, payment processing, dunning, and the transaction ledger." },
      { title: "Provisioning Engine", desc: "Queue-driven server provisioning with cPanel/WHM and Plesk drivers, retries, and lifecycle events." },
      { title: "Domain Management", desc: "Domain registration, renewal, contact management, and registrar integration." },
      { title: "Support & Ticketing", desc: "Client ticket creation, staff assignment, reply threading, and ticket status automation." },
      { title: "Authentication & Roles", desc: "Sanctum-based auth, tenant-scoped sessions, role definitions, and permission policies." },
      { title: "Product Catalog", desc: "Product groups, pricing cycles, service types, and catalog management APIs." },
    ],
  },
  {
    groupKey: "docsOps" as const,
    color: "#036deb",
    items: [
      { title: "Docker Setup", desc: "Development, staging, and production Docker Compose configurations with all services." },
      { title: "Production Deployment", desc: "Step-by-step production deployment runbook: migrations, cache warmup, queue startup." },
      { title: "Staging Environment", desc: "Configure a staging environment that mirrors production for pre-launch validation." },
      { title: "Backup & Recovery", desc: "PostgreSQL dump backups, Redis RDB snapshots, storage archives, and restore procedures." },
      { title: "Monitoring & Health Checks", desc: "Health endpoints, Prometheus metrics, alert thresholds, and webhook alert delivery." },
      { title: "CI/CD Overview", desc: "GitHub Actions pipeline structure, environment gates, and deployment automation." },
      { title: "Performance Testing", desc: "k6 load test scenarios, concurrency baselines, and performance benchmarks." },
    ],
  },
  {
    groupKey: "docsDev" as const,
    color: "#002d8e",
    items: [
      { title: "API Overview", desc: "RESTful API structure, authentication, versioning (v1), and response format conventions." },
      { title: "Webhooks", desc: "Incoming webhook processing for Stripe and PayPal — signature verification and event handling." },
      { title: "Localization & RTL", desc: "EN/AR locale routing, translation file structure, RTL layout behavior, and adding new locales." },
      { title: "Development Environment", desc: "Local development setup with Hot Module Replacement, queue worker, and scheduler." },
    ],
  },
  {
    groupKey: "docsSecurity" as const,
    color: "#1B7A4A",
    items: [
      { title: "Security Hardening", desc: "XSS protections, CSRF, rate limiting, webhook allowlisting, and tenant isolation audit." },
      { title: "Troubleshooting", desc: "Common issues, diagnostic commands, log locations, and queue failure recovery." },
      { title: "FAQ", desc: "Frequently asked questions about the platform, licensing, migration, and operations." },
    ],
  },
];

export default async function DocumentationPage({ params }: Readonly<{ params: { locale: string } }>) {
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const content = getLaunchContent(locale);
  const p = content.pages;

  const groupLabels: Record<string, string> = {
    docsGettingStarted: p.docsGettingStarted,
    docsPlatform: p.docsPlatform,
    docsOps: p.docsOps,
    docsDev: p.docsDev,
    docsSecurity: p.docsSecurity,
  };

  return (
    <MarketingShell currentPath="/documentation" locale={locale}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(4,141,254,0.1)] bg-gradient-to-br from-[#002d8e] via-[#0054c5] to-[#048dfe]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="section-label mb-5">{p.docsBadge}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">{p.docsHeroTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#b3d4f5]">{p.docsHeroDesc}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {docsCategories.map((cat) => (
              <a key={cat.groupKey} href={`#${cat.groupKey}`} className="rounded-lg border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.16)]">
                {groupLabels[cat.groupKey]}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Docs content */}
      <section className="bg-[#f7faff] py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16">
            {docsCategories.map((cat) => (
              <div key={cat.groupKey} id={cat.groupKey}>
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-5 w-1 rounded-full" style={{ background: cat.color }} />
                  <h2 className="text-2xl font-extrabold tracking-tight text-[#0a1628]">{groupLabels[cat.groupKey]}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {cat.items.map((item) => (
                    <div key={item.title} className="group feature-card cursor-pointer">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-[#0a1628] group-hover:text-[#048dfe] transition-colors">{item.title}</h3>
                        <svg className="h-4 w-4 shrink-0 text-[#7a95b5] group-hover:text-[#048dfe] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                      <p className="text-sm leading-6 text-[#4a5e7a]">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 overflow-hidden rounded-2xl bg-[#002d8e] p-10 text-center">
            <h2 className="text-2xl font-extrabold text-white">Ready to get started?</h2>
            <p className="mt-2 text-[#93b4d8]">Start the provider onboarding wizard and have your platform live in minutes.</p>
            <Link href={localePath(locale, "/onboarding")} className="btn-primary mt-6 inline-flex px-8 py-3">{content.primaryCta}</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
