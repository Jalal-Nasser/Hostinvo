import { type AppLocale } from "@/i18n/routing";

export type LaunchPlan = {
  key: "starter" | "professional" | "enterprise";
  name: string;
  price: string;
  description: string;
  limits: string[];
  ctaLabel: string;
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
    badge: "Phase 24 - Launch Preparation",
    heroTitle: "Commercial-ready hosting automation platform",
    heroDescription:
      "Hostinvo is ready for provider launch with licensing controls, production-grade infrastructure, tenant isolation, and modular operations for hosting businesses.",
    primaryCta: "Start Provider Onboarding",
    secondaryCta: "Explore Pricing",
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
      plansTitle: "License pricing tiers",
      plansDescription:
        "Choose the plan that matches your client volume and infrastructure growth stage.",
      featuresTitle: "Launch-ready feature set",
      featuresDescription:
        "Everything needed to run a hosting SaaS operation with billing, support, domains, and provisioning.",
      docsTitle: "Launch documentation",
      docsDescription:
        "Operational runbooks and launch guidance for onboarding, production deployment, and monitoring.",
      contactTitle: "Talk to sales",
      contactDescription:
        "Reach the launch team for pricing guidance, enterprise onboarding, and migration planning.",
    },
    plans: [
      {
        key: "starter",
        name: "Starter",
        price: "$49 / month",
        description: "For early-stage providers launching managed hosting operations.",
        limits: ["250 clients", "5 servers", "Single production activation"],
        ctaLabel: "Choose Starter",
      },
      {
        key: "professional",
        name: "Professional",
        price: "$149 / month",
        description: "For growing providers with multi-team operations and larger client bases.",
        limits: ["1000 clients", "20 servers", "Up to 3 activations"],
        ctaLabel: "Choose Professional",
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "Custom",
        description: "For high-scale providers needing unrestricted usage and custom support.",
        limits: ["Unlimited clients", "Unlimited servers", "Unlimited activations"],
        ctaLabel: "Contact Enterprise Sales",
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
    badge: "المرحلة 24 - التحضير للإطلاق",
    heroTitle: "منصة أتمتة استضافة جاهزة للإطلاق التجاري",
    heroDescription:
      "Hostinvo جاهز لإطلاق مزودي الاستضافة عبر نظام تراخيص، بنية إنتاجية، عزل متعدد المستأجرين، وتشغيل معياري متكامل.",
    primaryCta: "ابدأ إعداد مزود الخدمة",
    secondaryCta: "استعرض الأسعار",
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
      plansTitle: "باقات تراخيص Hostinvo",
      plansDescription: "اختر الباقة المناسبة لحجم عملائك وتوسع البنية التحتية لديك.",
      featuresTitle: "مزايا جاهزة للإطلاق",
      featuresDescription:
        "كل ما تحتاجه لتشغيل منصة استضافة SaaS تشمل الفوترة والدعم والنطاقات والتزويد.",
      docsTitle: "توثيق الإطلاق",
      docsDescription:
        "أدلة تشغيلية وخطط إطلاق لتجهيز الإعداد، الإنتاج، والمراقبة.",
      contactTitle: "تواصل مع المبيعات",
      contactDescription:
        "تواصل مع فريق الإطلاق للمساعدة في اختيار الباقة، إعداد المؤسسة، وخطط الترحيل.",
    },
    plans: [
      {
        key: "starter",
        name: "Starter",
        price: "49 دولار / شهريًا",
        description: "مناسبة لمزودي الاستضافة في مرحلة الإطلاق الأولي.",
        limits: ["250 عميل", "5 خوادم", "تفعيل إنتاجي واحد"],
        ctaLabel: "اختر Starter",
      },
      {
        key: "professional",
        name: "Professional",
        price: "149 دولار / شهريًا",
        description: "مناسبة للمزودين في مرحلة النمو وتعدد فرق التشغيل.",
        limits: ["1000 عميل", "20 خادمًا", "حتى 3 تفعيلات"],
        ctaLabel: "اختر Professional",
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "سعر مخصص",
        description: "للمزودين على نطاق كبير مع متطلبات تشغيل ودعم متقدمة.",
        limits: ["عملاء غير محدودين", "خوادم غير محدودة", "تفعيلات غير محدودة"],
        ctaLabel: "تواصل لمؤسستك",
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
