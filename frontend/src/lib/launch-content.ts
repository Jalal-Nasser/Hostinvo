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
  primaryCta: string;
  secondaryCta: string;
  nav: {
    home: string;
    pricing: string;
    features: string;
    documentation: string;
    contact: string;
    onboarding: string;
    login: string;
  };
  sections: {
    plansTitle: string;
    plansDescription: string;
    featuresTitle: string;
    featuresDescription: string;
    docsTitle: string;
    docsDescription: string;
    contactTitle: string;
    contactDescription: string;
  };
  plans: LaunchPlan[];
  features: LaunchFeature[];
  documentationItems: Array<{ title: string; description: string }>;
  contact: {
    email: string;
    salesHours: string;
    note: string;
    formTitle: string;
    formDescription: string;
    formNamePlaceholder: string;
    formEmailPlaceholder: string;
    formRequirementsPlaceholder: string;
    formButtonLabel: string;
  };
  onboarding: {
    title: string;
    description: string;
    stepLabels: string[];
  };
};

const launchContentByLocale: Record<AppLocale, LaunchContent> = {
  en: {
    badge: "Hosting automation platform",
    heroTitle: "Hosting automation for modern providers",
    heroDescription:
      "Run your hosting business with automated billing, service provisioning, domain management, and support — all in one platform.",
    primaryCta: "Start Provider Onboarding",
    secondaryCta: "View Features",
    nav: {
      home: "Home",
      pricing: "Pricing",
      features: "Features",
      documentation: "Documentation",
      contact: "Contact",
      onboarding: "Onboarding",
      login: "Login",
    },
    sections: {
      plansTitle: "Simple, transparent pricing",
      plansDescription:
        "Choose the plan that fits your hosting business. Lower cost than WHMCS — more automation built in.",
      featuresTitle: "Platform features",
      featuresDescription:
        "Everything needed to run a hosting SaaS business with billing, support, domains, and provisioning.",
      docsTitle: "Documentation",
      docsDescription:
        "Operational runbooks and launch guidance for onboarding, production deployment, and monitoring.",
      contactTitle: "Talk to sales",
      contactDescription:
        "Reach the team for pricing guidance, enterprise onboarding, and migration planning.",
    },
    plans: [
      {
        key: "starter",
        name: "Starter",
        price: "$9",
        description: "Perfect for launching your first hosting business.",
        limits: ["Up to 100 clients", "1 server", "Basic billing automation", "Email support"],
        ctaLabel: "Get started free",
      },
      {
        key: "growth",
        name: "Growth",
        price: "$29",
        description: "For growing providers with more clients and servers to manage.",
        limits: ["Up to 500 clients", "5 servers", "Advanced billing + provisioning", "Priority support"],
        ctaLabel: "Start growing",
        featured: true,
      },
      {
        key: "professional",
        name: "Professional",
        price: "$69",
        description: "Full automation stack for serious hosting operations.",
        limits: ["Up to 2,000 clients", "20 servers", "Full automation stack", "Dedicated support"],
        ctaLabel: "Go professional",
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "Custom",
        description: "Unlimited scale with custom SLAs and dedicated infrastructure.",
        limits: ["Unlimited clients", "Unlimited servers", "Custom integrations", "White-glove onboarding"],
        ctaLabel: "Contact sales",
      },
    ],
    features: [
      {
        title: "Multi-tenant architecture",
        description:
          "Shared-schema tenant isolation with tenant-aware middleware, policies, and secure request scoping.",
      },
      {
        title: "Billing and gateway stack",
        description:
          "Invoice lifecycle, payment tracking, Stripe and PayPal webhook processing, and transaction auditing.",
      },
      {
        title: "Provisioning automation",
        description:
          "Queue-driven lifecycle operations with cPanel and Plesk drivers, retries, and provisioning logs.",
      },
      {
        title: "Localization and RTL",
        description:
          "English and Arabic support with locale-aware routing and RTL/LTR layout switching.",
      },
      {
        title: "Operational resilience",
        description:
          "Production Docker topology, health checks, structured logging, monitoring alerts, and CI/CD pipelines.",
      },
      {
        title: "Security hardening",
        description:
          "Tenant-scoped sessions, token safety, rate limits, webhook restrictions, and stored-XSS protections.",
      },
    ],
    documentationItems: [
      {
        title: "Launch Preparation",
        description:
          "Licensing model, provider onboarding flow, production checklist, and go-live controls.",
      },
      {
        title: "Docker Setup",
        description:
          "Development, staging, and production container configuration with queue/scheduler services.",
      },
      {
        title: "Monitoring",
        description:
          "Metrics, alert thresholds, queue backlog handling, and health endpoint integration.",
      },
      {
        title: "Performance Testing",
        description:
          "k6 load patterns, concurrency guidance, and critical metrics baselines for launch validation.",
      },
    ],
    contact: {
      email: "launch@hostinvo.example",
      salesHours: "Sunday - Thursday, 09:00-18:00 UTC+3",
      note: "Enterprise and migration consultations are handled through scheduled onboarding calls.",
      formTitle: "Lead Form",
      formDescription:
        "Share your expected tenant volume, migration timeline, and preferred launch date.",
      formNamePlaceholder: "Name",
      formEmailPlaceholder: "Email",
      formRequirementsPlaceholder: "Requirements",
      formButtonLabel: "Contact Sales",
    },
    onboarding: {
      title: "Provider onboarding wizard",
      description:
        "Set up a provider account, configure company profile, connect the first server, and publish the first product.",
      stepLabels: [
        "Create account",
        "Configure company",
        "Add first server",
        "Create first product",
      ],
    },
  },
  ar: {
    badge: "منصة أتمتة الاستضافة",
    heroTitle: "أتمتة الاستضافة للمزودين الحديثين",
    heroDescription:
      "أدر أعمال الاستضافة بالكامل — فوترة تلقائية، تزويد خدمات، إدارة نطاقات، ودعم — كل ذلك في منصة واحدة.",
    primaryCta: "ابدأ إعداد مزود الخدمة",
    secondaryCta: "استعرض المزايا",
    nav: {
      home: "الرئيسية",
      pricing: "الأسعار",
      features: "المزايا",
      documentation: "التوثيق",
      contact: "تواصل",
      onboarding: "الإعداد",
      login: "تسجيل الدخول",
    },
    sections: {
      plansTitle: "أسعار شفافة وبسيطة",
      plansDescription: "اختر الباقة المناسبة لعملك. تكلفة أقل من WHMCS — أتمتة أكثر.",
      featuresTitle: "مزايا المنصة",
      featuresDescription:
        "كل ما تحتاجه لتشغيل منصة استضافة SaaS تشمل الفوترة والدعم والنطاقات والتزويد.",
      docsTitle: "التوثيق",
      docsDescription:
        "أدلة تشغيلية وخطط إطلاق لتجهيز الإعداد، الإنتاج، والمراقبة.",
      contactTitle: "تواصل مع المبيعات",
      contactDescription:
        "تواصل مع الفريق للمساعدة في اختيار الباقة، إعداد المؤسسة، وخطط الترحيل.",
    },
    plans: [
      {
        key: "starter",
        name: "Starter",
        price: "$9",
        description: "مثالية للبدء بأعمال استضافة جديدة.",
        limits: ["حتى 100 عميل", "خادم واحد", "أتمتة فوترة أساسية", "دعم عبر البريد"],
        ctaLabel: "ابدأ مجانًا",
      },
      {
        key: "growth",
        name: "Growth",
        price: "$29",
        description: "للمزودين في مرحلة النمو مع عملاء وخوادم أكثر.",
        limits: ["حتى 500 عميل", "5 خوادم", "فوترة وتزويد متقدم", "دعم مُفضَّل"],
        ctaLabel: "ابدأ النمو",
        featured: true,
      },
      {
        key: "professional",
        name: "Professional",
        price: "$69",
        description: "أتمتة كاملة لعمليات الاستضافة الاحترافية.",
        limits: ["حتى 2,000 عميل", "20 خادمًا", "حزمة أتمتة كاملة", "دعم مخصص"],
        ctaLabel: "انتقل للاحتراف",
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "مخصص",
        description: "توسع غير محدود مع اتفاقيات مستوى خدمة مخصصة.",
        limits: ["عملاء غير محدودين", "خوادم غير محدودة", "تكاملات مخصصة", "إعداد مُدار"],
        ctaLabel: "تواصل مع المبيعات",
      },
    ],
    features: [
      {
        title: "بنية متعددة المستأجرين",
        description:
          "عزل محكم على مستوى tenant_id مع middleware وسياسات وصول آمنة لكل مستأجر.",
      },
      {
        title: "الفوترة وبوابات الدفع",
        description:
          "إدارة الفواتير والمدفوعات وتكامل Stripe وPayPal عبر webhooks وسجل معاملات كامل.",
      },
      {
        title: "أتمتة التزويد",
        description:
          "عمليات دورة حياة عبر الطوابير مع تكامل cPanel وPlesk وسجل تزويد مع إعادة المحاولة.",
      },
      {
        title: "دعم عربي وإنجليزي",
        description:
          "تبديل لغات كامل مع دعم اتجاه RTL/LTR ومسارات مبنية على اللغة.",
      },
      {
        title: "استقرار تشغيلي",
        description:
          "بنية Docker إنتاجية مع فحوصات صحة، سجلات منظمة، تنبيهات مراقبة، وخط CI/CD.",
      },
      {
        title: "تعزيزات أمنية",
        description:
          "عزل جلسات المستأجر، حماية التوكنات، حدود معدل الطلبات، ومنع XSS المخزن.",
      },
    ],
    documentationItems: [
      {
        title: "التحضير للإطلاق",
        description:
          "شرح نظام التراخيص، تدفق إعداد المزود، وقائمة تحقق ما قبل الإطلاق.",
      },
      {
        title: "إعداد Docker",
        description: "تهيئة بيئات التطوير والتجهيز والإنتاج مع خدمات الطوابير والمجدول.",
      },
      {
        title: "المراقبة",
        description:
          "مقاييس الأداء والتنبيهات وفحص صحة الخدمات والطوابير في بيئة الإنتاج.",
      },
      {
        title: "اختبارات الأداء",
        description: "سيناريوهات k6 وحدود التزامن والمؤشرات الأساسية قبل الإطلاق.",
      },
    ],
    contact: {
      email: "launch@hostinvo.example",
      salesHours: "الأحد - الخميس، 09:00-18:00 (UTC+3)",
      note: "يتم ترتيب اجتماعات الإعداد المؤسسي والترحيل عبر مواعيد مخصصة.",
      formTitle: "نموذج التواصل",
      formDescription: "شارك حجم العملاء المتوقع، وخطة الترحيل، وتاريخ الإطلاق المستهدف.",
      formNamePlaceholder: "الاسم",
      formEmailPlaceholder: "البريد الإلكتروني",
      formRequirementsPlaceholder: "المتطلبات",
      formButtonLabel: "إرسال إلى المبيعات",
    },
    onboarding: {
      title: "معالج إعداد مزود الخدمة",
      description:
        "أنشئ الحساب، اضبط بيانات الشركة، أضف أول خادم، ثم أنشئ أول منتج.",
      stepLabels: [
        "إنشاء الحساب",
        "إعداد الشركة",
        "إضافة أول خادم",
        "إنشاء أول منتج",
      ],
    },
  },
};

export function getLaunchContent(locale: AppLocale): LaunchContent {
  return launchContentByLocale[locale];
}
