import { type AppLocale } from "@/i18n/routing";

export type LaunchPlan = {
  key: "starter" | "growth" | "professional" | "enterprise";
  name: string;
  price: string;
  description: string;
  limits: string[];
  ctaLabel: string;
  featured?: boolean;
};

export type LaunchFeature = {
  title: string;
  description: string;
};

export type LaunchContent = {
  badge: string;
  heroTitle: string;
  heroDescription: string;
  heroSubnote: string;
  primaryCta: string;
  secondaryCta: string;
  mostPopular: string;
  perMonth: string;
  pricingNote: string;
  nav: {
    home: string; features: string; automation: string; pricing: string;
    integrations: string; documentation: string; contact: string;
    onboarding: string; startOnboarding: string; login: string;
  };
  stats: Array<{ value: string; label: string }>;
  valueProps: Array<{ icon: string; color: string; title: string; body: string }>;
  sections: {
    whyBadge: string; whyTitle: string; whyDescription: string;
    provisioningBadge: string; provisioningTitle: string; provisioningDescription: string;
    billingBadge: string; billingTitle: string; billingDescription: string;
    featuresBadge: string; featuresTitle: string; featuresDescription: string;
    automationBadge: string; automationTitle: string; automationDescription: string;
    plansBadge: string; plansTitle: string; plansDescription: string;
    ctaBandTitle: string; ctaBandDescription: string; ctaBandSubnote: string;
    contactSales: string; docsTitle: string; docsDescription: string;
    contactTitle: string; contactDescription: string;
  };
  provisioningFeatures: string[];
  billingFeatures: string[];
  automationSteps: Array<{ step: string; title: string; desc: string; icon: string }>;
  plans: LaunchPlan[];
  features: LaunchFeature[];
  documentationItems: Array<{ title: string; description: string }>;
  contact: {
    email: string; salesHours: string; note: string; formTitle: string;
    formDescription: string; formNamePlaceholder: string; formEmailPlaceholder: string;
    formRequirementsPlaceholder: string; formButtonLabel: string;
  };
  onboarding: { title: string; description: string; stepLabels: string[] };
  footer: {
    productGroup: string; resourcesGroup: string; companyGroup: string; legalGroup: string;
    automation: string; security: string; integrations: string;
    apiReference: string; guides: string; changelog: string;
    about: string; careers: string; blog: string;
    privacy: string; terms: string; cookies: string;
    copyright: string; techStack: string;
  };
  pages: {
    docsBadge: string; docsHeroTitle: string; docsHeroDesc: string;
    docsGettingStarted: string; docsPlatform: string; docsOps: string; docsDev: string; docsSecurity: string;
    contactBadge: string; contactHeroTitle: string; contactHeroDesc: string;
    contactResponseTime: string; contactResponseLabel: string;
    contactWhoTitle: string; contactMigrationTitle: string; contactMigrationDesc: string;
    contactEnterpriseTitle: string; contactEnterpriseDesc: string;
    featuresBadge: string; featuresHeroTitle: string; featuresHeroDesc: string;
    featuresCapTitle: string; featuresCapDesc: string;
    aboutBadge: string; aboutTitle: string; aboutDesc: string;
    aboutMissionTitle: string; aboutMissionDesc: string;
    aboutStackTitle: string; aboutValuesTitle: string;
    careersBadge: string; careersTitle: string; careersDesc: string;
    careersOpenTitle: string; careersNoOpenings: string; careersSpecTitle: string; careersSpecDesc: string;
    blogBadge: string; blogTitle: string; blogDesc: string; blogComingSoon: string;
    changelogBadge: string; changelogTitle: string; changelogDesc: string;
    guidesBadge: string; guidesTitle: string; guidesDesc: string;
    apiBadge: string; apiTitle: string; apiDesc: string;
    privacyBadge: string; privacyTitle: string;
    termsBadge: string; termsTitle: string;
    cookiesBadge: string; cookiesTitle: string;
    lastUpdated: string;
    viewDocs: string; viewGuides: string; viewApi: string;
  };
};

const launchContentByLocale: Record<AppLocale, LaunchContent> = {
  en: {
    badge: "Hosting Automation Platform",
    heroTitle: "Hosting automation for modern providers",
    heroDescription: "Run your entire hosting business with automated billing, service provisioning, domain management, and client support — all in one platform.",
    heroSubnote: "Better value than WHMCS · Built on Laravel + Next.js · Self-hosted or managed",
    primaryCta: "Start Free Onboarding",
    secondaryCta: "View Pricing",
    mostPopular: "Most Popular",
    perMonth: "/mo",
    pricingNote: "Launch-ready pricing designed for growing hosting providers",
    nav: {
      home: "Home", features: "Features", automation: "Automation", pricing: "Pricing",
      integrations: "Integrations", documentation: "Documentation", contact: "Contact",
      onboarding: "Get Started", startOnboarding: "Start Free", login: "Login",
    },
    stats: [
      { value: "500+", label: "Hosting Providers" }, { value: "1M+", label: "Invoices Processed" },
      { value: "99.9%", label: "Platform Uptime" }, { value: "4×", label: "Better Value than WHMCS" },
    ],
    valueProps: [
      { icon: "⚡", color: "#048dfe", title: "Instant Provisioning", body: "Queue-driven lifecycle operations with cPanel and Plesk drivers. Accounts created, suspended, and terminated automatically — no manual intervention." },
      { icon: "💳", color: "#0054c5", title: "Automated Billing", body: "Full invoice lifecycle, Stripe and PayPal webhooks, payment tracking, and auto-renewal. Your revenue runs itself." },
      { icon: "🛡️", color: "#002d8e", title: "Enterprise Security", body: "Multi-tenant isolation enforced at the database level. Every request is scoped, audited, and protected against cross-tenant data leakage." },
    ],
    sections: {
      whyBadge: "Why Hostinvo", whyTitle: "Everything you need to run a hosting business",
      whyDescription: "From your first client to enterprise scale — automated billing, provisioning, and support in one platform.",
      provisioningBadge: "Provisioning", provisioningTitle: "Automate the entire hosting lifecycle",
      provisioningDescription: "Connect cPanel/WHM or Plesk servers and let Hostinvo handle account creation, suspension, termination, and password resets — triggered automatically from billing events.",
      billingBadge: "Billing", billingTitle: "Invoicing that runs on autopilot",
      billingDescription: "Generate, send, and collect invoices automatically. Stripe and PayPal webhook processing, dunning management, and a full audit trail — all built in.",
      featuresBadge: "Platform Features", featuresTitle: "Platform features",
      featuresDescription: "Everything needed to run a hosting SaaS business with billing, support, domains, and provisioning.",
      automationBadge: "Automation", automationTitle: "From order to live service — automatically",
      automationDescription: "Zero manual steps between a client placing an order and their hosting account going live.",
      plansBadge: "Pricing", plansTitle: "Simple, transparent pricing",
      plansDescription: "Launch-ready pricing designed for growing hosting providers. Better value than traditional hosting automation platforms.",
      ctaBandTitle: "Ready to modernise your hosting business?",
      ctaBandDescription: "Start free. No credit card required. Set up in under 10 minutes.",
      ctaBandSubnote: "Join hundreds of hosting providers already running on Hostinvo.",
      contactSales: "Contact Sales",
      docsTitle: "Documentation", docsDescription: "Operational runbooks and launch guidance for onboarding, production deployment, and monitoring.",
      contactTitle: "Talk to Sales", contactDescription: "Reach the team for pricing guidance, enterprise onboarding, and migration planning.",
    },
    provisioningFeatures: ["cPanel & Plesk driver support", "4-tier Redis queue (critical → default → low → failed)", "Automatic retries with exponential backoff", "Real-time provisioning logs"],
    billingFeatures: ["Auto-generated recurring invoices", "Stripe & PayPal gateway support", "Webhook signature verification", "Late fee automation & dunning"],
    automationSteps: [
      { step: "01", title: "Client Orders", desc: "Client selects a product and completes checkout", icon: "🛒" },
      { step: "02", title: "Invoice Created", desc: "Invoice auto-generated and payment link sent", icon: "📄" },
      { step: "03", title: "Payment Received", desc: "Stripe or PayPal webhook confirms payment", icon: "✅" },
      { step: "04", title: "Job Dispatched", desc: "Provisioning job pushed to critical queue", icon: "⚡" },
      { step: "05", title: "Account Live", desc: "cPanel or Plesk account created — client notified", icon: "🚀" },
    ],
    plans: [
      { key: "starter", name: "Starter", price: "$9", description: "Launch your hosting business with core automation built in.", limits: ["Up to 100 clients", "1 server", "Core billing & client management", "Email support"], ctaLabel: "Get started free" },
      { key: "growth", name: "Growth", price: "$29", description: "For growing providers managing more clients and multiple servers.", limits: ["Up to 500 clients", "5 servers", "Billing + provisioning automation", "Domain management", "Priority email support"], ctaLabel: "Start growing", featured: true },
      { key: "professional", name: "Professional", price: "$49", description: "Full automation suite for serious hosting operations at scale.", limits: ["Up to 2,000 clients", "20 servers", "Full automation suite", "Advanced integrations", "Priority support"], ctaLabel: "Go professional" },
      { key: "enterprise", name: "Enterprise", price: "Custom", description: "Unlimited scale with custom SLAs and dedicated infrastructure.", limits: ["Unlimited clients", "Unlimited servers", "Custom onboarding", "Dedicated support", "Advanced deployment options"], ctaLabel: "Contact sales" },
    ],
    features: [
      { title: "Multi-tenant architecture", description: "Shared-schema tenant isolation with tenant-aware middleware, policies, and secure request scoping." },
      { title: "Billing and gateway stack", description: "Invoice lifecycle, payment tracking, Stripe and PayPal webhook processing, and transaction auditing." },
      { title: "Provisioning automation", description: "Queue-driven lifecycle operations with cPanel and Plesk drivers, retries, and provisioning logs." },
      { title: "Arabic & English support", description: "English and Arabic with locale-aware routing, RTL/LTR layout switching, and bilingual UI." },
      { title: "Operational resilience", description: "Production Docker topology, health checks, structured logging, monitoring alerts, and CI/CD pipelines." },
      { title: "Security hardening", description: "Tenant-scoped sessions, token safety, rate limits, webhook restrictions, and stored-XSS protections." },
    ],
    documentationItems: [
      { title: "Launch Preparation", description: "Licensing model, provider onboarding flow, production checklist, and go-live controls." },
      { title: "Docker Setup", description: "Development, staging, and production container configuration with queue/scheduler services." },
      { title: "Monitoring", description: "Metrics, alert thresholds, queue backlog handling, and health endpoint integration." },
      { title: "Performance Testing", description: "k6 load patterns, concurrency guidance, and critical metrics baselines for launch validation." },
    ],
    contact: {
      email: "launch@hostinvo.com", salesHours: "Sunday – Thursday, 09:00–18:00 UTC+3",
      note: "Enterprise and migration consultations are handled through scheduled onboarding calls.",
      formTitle: "Talk to Sales", formDescription: "Share your expected tenant volume, migration timeline, and preferred launch date.",
      formNamePlaceholder: "Your name", formEmailPlaceholder: "Work email",
      formRequirementsPlaceholder: "Tell us about your hosting operation and requirements",
      formButtonLabel: "Send to Sales",
    },
    onboarding: {
      title: "Provider onboarding wizard",
      description: "Set up a provider account, configure company profile, connect the first server, and publish the first product.",
      stepLabels: ["Create account", "Configure company", "Add first server", "Create first product"],
    },
    footer: {
      productGroup: "Product", resourcesGroup: "Resources", companyGroup: "Company", legalGroup: "Legal",
      automation: "Automation", security: "Security", integrations: "Integrations",
      apiReference: "API Reference", guides: "Guides", changelog: "Changelog",
      about: "About", careers: "Careers", blog: "Blog",
      privacy: "Privacy Policy", terms: "Terms of Service", cookies: "Cookie Policy",
      copyright: "© 2026 Hostinvo. All rights reserved.",
      techStack: "Laravel · Next.js · PostgreSQL · Redis · Docker",
    },
    pages: {
      docsBadge: "Developer Documentation", docsHeroTitle: "Hostinvo Documentation",
      docsHeroDesc: "Everything you need to deploy, configure, and operate the Hostinvo hosting automation platform.",
      docsGettingStarted: "Getting Started", docsPlatform: "Platform Modules", docsOps: "Operations & Deployment", docsDev: "Developer Reference", docsSecurity: "Security & Compliance",
      contactBadge: "Talk to Sales", contactHeroTitle: "Let's build your hosting business together",
      contactHeroDesc: "Whether you're migrating from WHMCS, launching a new operation, or scaling an existing one — our team is here to help.",
      contactResponseTime: "< 4 hours", contactResponseLabel: "Average response time",
      contactWhoTitle: "Who should contact sales?",
      contactMigrationTitle: "Migrating from WHMCS?", contactMigrationDesc: "We provide dedicated migration planning and data transition support for providers moving from WHMCS or other platforms.",
      contactEnterpriseTitle: "Enterprise onboarding", contactEnterpriseDesc: "For large-scale operations, we offer white-glove onboarding, custom SLA negotiation, and dedicated infrastructure planning.",
      featuresBadge: "Platform Features", featuresHeroTitle: "Built for hosting providers, not everyone",
      featuresHeroDesc: "Every feature in Hostinvo is designed specifically for the hosting automation use case — billing, provisioning, domains, and client management.",
      featuresCapTitle: "Full capability overview", featuresCapDesc: "Hostinvo ships with a complete stack for running a hosting business.",
      aboutBadge: "About Hostinvo", aboutTitle: "Modern hosting automation for ambitious providers",
      aboutDesc: "Hostinvo was built to give hosting providers a better alternative to legacy platforms — with modern architecture, full automation, and transparent pricing.",
      aboutMissionTitle: "Our mission", aboutMissionDesc: "Give every hosting provider — from startups to large operations — the automation tools previously only affordable for large enterprises.",
      aboutStackTitle: "Built on modern open-source", aboutValuesTitle: "What we stand for",
      careersBadge: "Careers", careersTitle: "Help shape the future of hosting automation",
      careersDesc: "We're a small, focused team building modern infrastructure tooling for the hosting industry.",
      careersOpenTitle: "Open positions", careersNoOpenings: "No open positions at this time. Check back soon or send us a speculative application.",
      careersSpecTitle: "Speculative applications", careersSpecDesc: "Interested in working with us but don't see a role? Send your CV and a short note about what you'd like to work on.",
      blogBadge: "Blog", blogTitle: "Insights from the Hostinvo team",
      blogDesc: "Product updates, hosting industry insights, and technical deep-dives from the team building Hostinvo.",
      blogComingSoon: "Blog content coming soon. Subscribe for updates.",
      changelogBadge: "Changelog", changelogTitle: "What's new in Hostinvo",
      changelogDesc: "Platform updates, improvements, and release notes — updated with every release.",
      guidesBadge: "Guides", guidesTitle: "Step-by-step guides for hosting providers",
      guidesDesc: "Practical tutorials for setting up, configuring, and getting the most out of the Hostinvo platform.",
      apiBadge: "API Reference", apiTitle: "Hostinvo REST API",
      apiDesc: "Integrate, extend, and automate Hostinvo with the REST API.",
      privacyBadge: "Legal", privacyTitle: "Privacy Policy",
      termsBadge: "Legal", termsTitle: "Terms of Service",
      cookiesBadge: "Legal", cookiesTitle: "Cookie Policy",
      lastUpdated: "Last updated: January 2026",
      viewDocs: "View Documentation", viewGuides: "View Guides", viewApi: "View API Reference",
    },
  },
  ar: {
    badge: "منصة أتمتة الاستضافة",
    heroTitle: "أتمتة الاستضافة للمزودين الحديثين",
    heroDescription: "أدر أعمال الاستضافة بالكامل — فوترة تلقائية، تزويد خدمات، إدارة نطاقات، ودعم عملاء — كل ذلك في منصة واحدة متكاملة.",
    heroSubnote: "قيمة أفضل من WHMCS · مبني على Laravel + Next.js · استضافة ذاتية أو مُدارة",
    primaryCta: "ابدأ الإعداد مجاناً",
    secondaryCta: "استعرض الأسعار",
    mostPopular: "الأكثر طلباً",
    perMonth: "/شهر",
    pricingNote: "أسعار مصممة للمزودين الناشئين — أفضل قيمة من منصات الأتمتة التقليدية",
    nav: {
      home: "الرئيسية", features: "المزايا", automation: "الأتمتة", pricing: "الأسعار",
      integrations: "التكاملات", documentation: "التوثيق", contact: "تواصل معنا",
      onboarding: "ابدأ الآن", startOnboarding: "ابدأ مجاناً", login: "تسجيل الدخول",
    },
    stats: [
      { value: "500+", label: "مزود استضافة" }, { value: "+1M", label: "فاتورة تمت معالجتها" },
      { value: "99.9%", label: "وقت تشغيل المنصة" }, { value: "4×", label: "قيمة أفضل من WHMCS" },
    ],
    valueProps: [
      { icon: "⚡", color: "#048dfe", title: "تزويد فوري", body: "عمليات دورة حياة مدفوعة بالطوابير مع تكامل cPanel وPlesk. إنشاء الحسابات وتعليقها وإنهاؤها تلقائياً — دون أي تدخل يدوي." },
      { icon: "💳", color: "#0054c5", title: "فوترة تلقائية", body: "دورة حياة فواتير متكاملة، معالجة Webhooks من Stripe وPayPal، متابعة المدفوعات، والتجديد التلقائي. إيراداتك تعمل وحدها." },
      { icon: "🛡️", color: "#002d8e", title: "أمان مؤسسي", body: "عزل المستأجرين على مستوى قاعدة البيانات. كل طلب محدود النطاق ومُدقَّق ومحمي من أي تسرب للبيانات بين المستأجرين." },
    ],
    sections: {
      whyBadge: "لماذا Hostinvo", whyTitle: "كل ما تحتاجه لإدارة أعمال الاستضافة",
      whyDescription: "من أول عميل حتى التوسع المؤسسي — فوترة تلقائية، تزويد خدمات، ودعم في منصة واحدة.",
      provisioningBadge: "التزويد", provisioningTitle: "أتمت دورة حياة الاستضافة بالكامل",
      provisioningDescription: "اربط خوادم cPanel/WHM أو Plesk ودع Hostinvo يتولى إنشاء الحسابات وتعليقها وإنهاؤها وإعادة تعيين كلمات المرور — يُشغَّل تلقائياً من أحداث الفوترة.",
      billingBadge: "الفوترة", billingTitle: "فوترة تعمل بشكل مستقل",
      billingDescription: "أنشئ الفواتير وأرسلها واحصّلها تلقائياً. معالجة Webhooks من Stripe وPayPal، إدارة التحصيل، وسجل تدقيق كامل — كلها مدمجة.",
      featuresBadge: "مزايا المنصة", featuresTitle: "مزايا المنصة",
      featuresDescription: "كل ما تحتاجه لتشغيل منصة استضافة SaaS تشمل الفوترة والدعم والنطاقات والتزويد.",
      automationBadge: "الأتمتة", automationTitle: "من الطلب إلى الخدمة الحية — تلقائياً",
      automationDescription: "لا خطوات يدوية بين تقديم العميل للطلب وتشغيل حساب الاستضافة.",
      plansBadge: "الأسعار", plansTitle: "أسعار شفافة وبسيطة",
      plansDescription: "أسعار مصممة للمزودين الناشئين. قيمة أفضل من منصات أتمتة الاستضافة التقليدية.",
      ctaBandTitle: "هل أنت مستعد لتطوير أعمال الاستضافة؟",
      ctaBandDescription: "ابدأ مجاناً. لا تتطلب بطاقة ائتمانية. جاهز خلال أقل من 10 دقائق.",
      ctaBandSubnote: "انضم إلى مئات مزودي الاستضافة الذين يعملون بالفعل على Hostinvo.",
      contactSales: "تواصل مع المبيعات",
      docsTitle: "التوثيق", docsDescription: "أدلة تشغيلية وخطط إطلاق لتجهيز الإعداد والإنتاج والمراقبة.",
      contactTitle: "تحدث مع فريق المبيعات", contactDescription: "تواصل مع الفريق للمساعدة في اختيار الباقة وإعداد المؤسسة وخطط الترحيل.",
    },
    provisioningFeatures: ["دعم تكامل cPanel وPlesk", "طوابير Redis رباعية المستويات (حرجة → افتراضية → منخفضة → فاشلة)", "إعادة محاولة تلقائية مع تراجع تدريجي", "سجلات تزويد في الوقت الفعلي"],
    billingFeatures: ["فواتير دورية تُنشأ تلقائياً", "دعم بوابتَي Stripe وPayPal", "التحقق من توقيعات Webhook", "أتمتة الرسوم المتأخرة وإدارة التحصيل"],
    automationSteps: [
      { step: "01", title: "الطلب", desc: "يختار العميل المنتج ويكمل عملية الشراء", icon: "🛒" },
      { step: "02", title: "إنشاء الفاتورة", desc: "تُنشأ الفاتورة تلقائياً ويُرسل رابط الدفع", icon: "📄" },
      { step: "03", title: "تأكيد الدفع", desc: "يُؤكَّد الدفع عبر Webhook من Stripe أو PayPal", icon: "✅" },
      { step: "04", title: "تنفيذ المهمة", desc: "تُرسَل مهمة التزويد إلى طابور الأولوية الحرجة", icon: "⚡" },
      { step: "05", title: "الخدمة حية", desc: "يُنشأ حساب cPanel أو Plesk ويُبلَّغ العميل", icon: "🚀" },
    ],
    plans: [
      { key: "starter", name: "Starter", price: "$9", description: "أطلق أعمال الاستضافة بالأتمتة الأساسية الكاملة.", limits: ["حتى 100 عميل", "خادم واحد", "إدارة الفوترة والعملاء", "دعم عبر البريد"], ctaLabel: "ابدأ مجاناً" },
      { key: "growth", name: "Growth", price: "$29", description: "للمزودين في مرحلة النمو مع عملاء وخوادم متعددة.", limits: ["حتى 500 عميل", "5 خوادم", "أتمتة الفوترة والتزويد", "إدارة النطاقات", "دعم بريدي مُفضَّل"], ctaLabel: "ابدأ النمو", featured: true },
      { key: "professional", name: "Professional", price: "$49", description: "حزمة أتمتة كاملة لعمليات الاستضافة الاحترافية الموسّعة.", limits: ["حتى 2,000 عميل", "20 خادماً", "حزمة الأتمتة الكاملة", "تكاملات متقدمة", "دعم ذو أولوية"], ctaLabel: "انتقل للاحتراف" },
      { key: "enterprise", name: "Enterprise", price: "مخصص", description: "توسع غير محدود مع اتفاقيات مستوى خدمة وبنية تحتية مخصصة.", limits: ["عملاء غير محدودين", "خوادم غير محدودة", "إعداد مخصص", "دعم مُخصَّص", "خيارات نشر متقدمة"], ctaLabel: "تواصل مع المبيعات" },
    ],
    features: [
      { title: "بنية متعددة المستأجرين", description: "عزل محكم على مستوى tenant_id مع Middleware وسياسات وصول آمنة لكل مستأجر." },
      { title: "الفوترة وبوابات الدفع", description: "إدارة الفواتير والمدفوعات وتكامل Stripe وPayPal عبر Webhooks وسجل معاملات كامل." },
      { title: "أتمتة التزويد", description: "عمليات دورة الحياة عبر الطوابير مع تكامل cPanel وPlesk وسجل تزويد مع إعادة المحاولة." },
      { title: "دعم العربية والإنجليزية", description: "دعم كامل للغتين مع مسارات مرتبطة باللغة وتبديل تلقائي بين RTL وLTR." },
      { title: "استقرار تشغيلي", description: "بنية Docker إنتاجية مع فحوصات صحة وسجلات منظمة وتنبيهات مراقبة وخط CI/CD." },
      { title: "تعزيزات أمنية", description: "عزل جلسات المستأجر، حماية التوكنات، حدود معدل الطلبات، ومنع XSS المخزن." },
    ],
    documentationItems: [
      { title: "التحضير للإطلاق", description: "شرح نظام التراخيص، تدفق إعداد المزود، وقائمة تحقق ما قبل الإطلاق." },
      { title: "إعداد Docker", description: "تهيئة بيئات التطوير والتجهيز والإنتاج مع خدمات الطوابير والمجدول." },
      { title: "المراقبة", description: "مقاييس الأداء والتنبيهات وفحص صحة الخدمات والطوابير في بيئة الإنتاج." },
      { title: "اختبارات الأداء", description: "سيناريوهات k6 وحدود التزامن والمؤشرات الأساسية قبل الإطلاق." },
    ],
    contact: {
      email: "launch@hostinvo.com", salesHours: "الأحد – الخميس، 09:00–18:00 (UTC+3)",
      note: "يُرتَّب الإعداد المؤسسي واستشارات الترحيل عبر مواعيد مخصصة.",
      formTitle: "تحدث مع فريق المبيعات", formDescription: "شارك حجم العملاء المتوقع وخطة الترحيل وتاريخ الإطلاق المستهدف.",
      formNamePlaceholder: "اسمك الكامل", formEmailPlaceholder: "البريد الإلكتروني للعمل",
      formRequirementsPlaceholder: "أخبرنا عن عملك ومتطلباتك",
      formButtonLabel: "إرسال إلى المبيعات",
    },
    onboarding: {
      title: "معالج إعداد مزود الخدمة",
      description: "أنشئ الحساب، اضبط بيانات الشركة، أضف أول خادم، ثم أنشئ أول منتج.",
      stepLabels: ["إنشاء الحساب", "إعداد الشركة", "إضافة أول خادم", "إنشاء أول منتج"],
    },
    footer: {
      productGroup: "المنتج", resourcesGroup: "الموارد", companyGroup: "الشركة", legalGroup: "القانونية",
      automation: "الأتمتة", security: "الأمان", integrations: "التكاملات",
      apiReference: "مرجع API", guides: "الأدلة", changelog: "سجل التغييرات",
      about: "من نحن", careers: "الوظائف", blog: "المدونة",
      privacy: "سياسة الخصوصية", terms: "شروط الخدمة", cookies: "سياسة الكوكيز",
      copyright: "© 2026 Hostinvo. جميع الحقوق محفوظة.",
      techStack: "Laravel · Next.js · PostgreSQL · Redis · Docker",
    },
    pages: {
      docsBadge: "توثيق المطورين", docsHeroTitle: "توثيق Hostinvo",
      docsHeroDesc: "كل ما تحتاجه لنشر منصة Hostinvo وإعدادها وتشغيلها.",
      docsGettingStarted: "البدء السريع", docsPlatform: "وحدات المنصة", docsOps: "التشغيل والنشر", docsDev: "مرجع المطورين", docsSecurity: "الأمان والامتثال",
      contactBadge: "تواصل مع المبيعات", contactHeroTitle: "لنبني عمل الاستضافة معاً",
      contactHeroDesc: "سواء كنت تهاجر من WHMCS أو تطلق عملاً جديداً أو توسّع عملاً قائماً — فريقنا هنا لمساعدتك.",
      contactResponseTime: "أقل من 4 ساعات", contactResponseLabel: "متوسط وقت الاستجابة",
      contactWhoTitle: "من يجب أن يتواصل مع المبيعات؟",
      contactMigrationTitle: "الترحيل من WHMCS؟", contactMigrationDesc: "نقدم دعماً مخصصاً لتخطيط الترحيل وانتقال البيانات للمزودين الذين ينتقلون من WHMCS أو منصات أخرى.",
      contactEnterpriseTitle: "الإعداد المؤسسي", contactEnterpriseDesc: "للعمليات الكبيرة، نقدم إعداداً مُدارًا وتفاوضاً على اتفاقيات مستوى الخدمة وتخطيطاً للبنية التحتية المخصصة.",
      featuresBadge: "مزايا المنصة", featuresHeroTitle: "مبني لمزودي الاستضافة تحديداً",
      featuresHeroDesc: "كل ميزة في Hostinvo مصممة خصيصاً لحالة أتمتة الاستضافة — الفوترة والتزويد والنطاقات وإدارة العملاء.",
      featuresCapTitle: "نظرة عامة على الإمكانيات الكاملة", featuresCapDesc: "يأتي Hostinvo مزوداً بمجموعة متكاملة لإدارة أعمال الاستضافة.",
      aboutBadge: "عن Hostinvo", aboutTitle: "أتمتة استضافة حديثة للمزودين الطموحين",
      aboutDesc: "بُني Hostinvo ليمنح مزودي الاستضافة بديلاً أفضل من المنصات القديمة — بهندسة حديثة وأتمتة كاملة وأسعار شفافة.",
      aboutMissionTitle: "رسالتنا", aboutMissionDesc: "تزويد كل مزود استضافة — من الشركات الناشئة إلى العمليات الكبيرة — بأدوات الأتمتة التي كانت حكراً على المؤسسات الكبرى.",
      aboutStackTitle: "مبني على مصادر مفتوحة حديثة", aboutValuesTitle: "ما نؤمن به",
      careersBadge: "الوظائف", careersTitle: "ساعد في تشكيل مستقبل أتمتة الاستضافة",
      careersDesc: "نحن فريق صغير ومركّز نبني أدوات بنية تحتية حديثة لصناعة الاستضافة.",
      careersOpenTitle: "الوظائف المتاحة", careersNoOpenings: "لا توجد وظائف متاحة حالياً. تابعنا أو أرسل طلباً استكشافياً.",
      careersSpecTitle: "الطلبات الاستكشافية", careersSpecDesc: "هل تريد العمل معنا ولم تجد الدور المناسب؟ أرسل سيرتك الذاتية ومقدمة قصيرة.",
      blogBadge: "المدونة", blogTitle: "رؤى من فريق Hostinvo",
      blogDesc: "تحديثات المنتج ورؤى صناعة الاستضافة والتحليلات التقنية من الفريق.",
      blogComingSoon: "محتوى المدونة قريباً. اشترك للحصول على التحديثات.",
      changelogBadge: "سجل التغييرات", changelogTitle: "الجديد في Hostinvo",
      changelogDesc: "تحديثات المنصة والتحسينات وملاحظات الإصدار — تُحدَّث مع كل إصدار.",
      guidesBadge: "الأدلة", guidesTitle: "أدلة خطوة بخطوة لمزودي الاستضافة",
      guidesDesc: "دروس عملية لإعداد Hostinvo وتهيئته والاستفادة القصوى منه.",
      apiBadge: "مرجع API", apiTitle: "Hostinvo REST API",
      apiDesc: "تكامل وتوسيع وأتمتة Hostinvo عبر REST API.",
      privacyBadge: "قانوني", privacyTitle: "سياسة الخصوصية",
      termsBadge: "قانوني", termsTitle: "شروط الخدمة",
      cookiesBadge: "قانوني", cookiesTitle: "سياسة الكوكيز",
      lastUpdated: "آخر تحديث: يناير 2026",
      viewDocs: "عرض التوثيق", viewGuides: "عرض الأدلة", viewApi: "عرض مرجع API",
    },
  },
};

export function getLaunchContent(locale: AppLocale): LaunchContent {
  return launchContentByLocale[locale];
}
