export function tenantAdminCopy(locale: string) {
  const isArabic = locale === "ar";

  return {
    common: {
      saveChanges: isArabic ? "حفظ التغييرات" : "Save changes",
      saving: isArabic ? "جارٍ الحفظ..." : "Saving...",
      createNew: isArabic ? "إنشاء جديد" : "Create new",
      editItem: isArabic ? "تعديل" : "Edit",
      deleteItem: isArabic ? "حذف" : "Delete",
      deleteConfirm: isArabic
        ? "هل أنت متأكد من حذف هذا العنصر؟"
        : "Are you sure you want to delete this item?",
      createSuccess: isArabic
        ? "تم إنشاء العنصر بنجاح."
        : "Record created successfully.",
      updateSuccess: isArabic
        ? "تم تحديث العنصر بنجاح."
        : "Record updated successfully.",
      deleteSuccess: isArabic
        ? "تم حذف العنصر بنجاح."
        : "Record deleted successfully.",
      serviceUnavailable: isArabic
        ? "تعذر الوصول إلى الخدمة حالياً."
        : "The service is currently unavailable.",
      emptyTitle: isArabic ? "لا توجد عناصر بعد" : "No records yet",
      cancel: isArabic ? "إلغاء" : "Cancel",
      orderLabel: isArabic ? "الترتيب" : "Order",
      visibleLabel: isArabic ? "مرئي" : "Visible",
      labelEn: isArabic ? "الاسم الإنجليزي" : "English label",
      labelAr: isArabic ? "الاسم العربي" : "Arabic label",
      titleEn: isArabic ? "العنوان بالإنجليزية" : "English title",
      titleAr: isArabic ? "العنوان بالعربية" : "Arabic title",
      bodyEn: isArabic ? "المحتوى بالإنجليزية" : "English body",
      bodyAr: isArabic ? "المحتوى بالعربية" : "Arabic body",
      excerptEn: isArabic ? "الملخص بالإنجليزية" : "English excerpt",
      excerptAr: isArabic ? "الملخص بالعربية" : "Arabic excerpt",
      descriptionEn: isArabic ? "الوصف بالإنجليزية" : "English description",
      descriptionAr: isArabic ? "الوصف بالعربية" : "Arabic description",
      slug: isArabic ? "المعرّف المختصر" : "Slug",
      status: isArabic ? "الحالة" : "Status",
      featured: isArabic ? "مميز" : "Featured",
      publishedAt: isArabic ? "تاريخ النشر" : "Published at",
      backToSettings: isArabic ? "العودة إلى الإعدادات" : "Back to settings",
      backToContent: isArabic ? "العودة إلى المحتوى" : "Back to content",
      note: isArabic ? "ملاحظة" : "Note",
      currentAsset: isArabic ? "الملف الحالي" : "Current asset",
      removeAsset: isArabic ? "إزالة الملف الحالي" : "Remove current asset",
    },
    settings: {
      title: isArabic
        ? "إعدادات البوابة والهوية"
        : "Portal & identity settings",
      description: isArabic
        ? "أدر هوية المستأجر، مظهر البوابة، والمحتوى العميلي من لوحة الإدارة دون تعديل الكود."
        : "Manage tenant identity, portal presentation, and client-facing content from the admin dashboard without code edits.",
      brandingTitle: isArabic ? "الهوية والعلامة" : "Branding & identity",
      brandingDescription: isArabic
        ? "اسم الشركة، الشعار، الأيقونة، اسم البوابة، العملة، اللغة والمنطقة الزمنية."
        : "Company name, logo, favicon, portal name, currency, locale, and timezone.",
      surfaceTitle: isArabic ? "سطح البوابة" : "Portal surface",
      surfaceDescription: isArabic
        ? "تحكم في عناصر القائمة، أقسام الصفحة الرئيسية، بطاقات الإجراءات، ومصادر المحتوى."
        : "Control navigation items, homepage sections, action cards, and content sources.",
      contentTitle: isArabic ? "إدارة المحتوى" : "Content management",
      contentDescription: isArabic
        ? "أدر الأخبار، قاعدة المعرفة، الحوادث، كتل المحتوى وروابط التذييل."
        : "Manage announcements, knowledgebase, incidents, content blocks, and footer links.",
      paymentGatewaysTitle: isArabic ? "بوابات الدفع" : "Payment gateways",
      paymentGatewaysDescription: isArabic
        ? "اضبط Stripe وPayPal وتعليمات الدفع اليدوي لمساحة العمل الحالية."
        : "Configure Stripe, PayPal, and offline payment instructions for the current workspace.",
      openModule: isArabic ? "فتح الوحدة" : "Open module",
      platformTitle: isArabic ? "إعدادات منصة SaaS" : "SaaS platform settings",
      platformDescription: isArabic
        ? "إعدادات مالك المنصة لإدارة الخطط والتسعير، الفوترة، والمستأجرين."
        : "Platform owner controls for plans, license billing, and tenant operations.",
      platformKicker: isArabic ? "مالك المنصة" : "Platform owner",
      platformHeading: isArabic
        ? "إدارة خطط الترخيص وفوترة المستأجرين"
        : "Manage licensing plans and tenant billing",
      platformNote: isArabic
        ? "هذه الإعدادات تخص العلامة التجارية للمنصة وخيارات الترخيص. إعدادات هوية المستأجر والبوابة تبقى داخل كل لوحة مستأجر."
        : "These settings control the SaaS brand and licensing options. Tenant identity and portal settings live inside each tenant workspace.",
      platformCardKicker: isArabic ? "خيارات المنصة" : "Platform controls",
      platformPlansTitle: isArabic ? "الخطط والتسعير" : "Plans & pricing",
      platformPlansDescription: isArabic
        ? "عدّل خطط الترخيص المعروضة في الموقع التسويقي ولوحة المالك."
        : "Manage the license plans surfaced on the marketing site and owner dashboard.",
      platformPlansCta: isArabic ? "إدارة الخطط" : "Manage plans",
      platformTenantsTitle: isArabic ? "المستأجرون" : "Tenants",
      platformTenantsDescription: isArabic
        ? "اعرض المستأجرين، حالاتهم، وتراخيصهم."
        : "Review tenants, their status, and license posture.",
      platformTenantsCta: isArabic ? "عرض المستأجرين" : "View tenants",
      platformBillingTitle: isArabic ? "فوترة التراخيص" : "License billing",
      platformBillingDescription: isArabic
        ? "راقب فوترة التراخيص وربط بوابات الدفع."
        : "Monitor license billing and connect payment gateways.",
      platformBillingCta: isArabic
        ? "عرض فوترة التراخيص"
        : "Open license billing",
    },
    branding: {
      pageTitle: isArabic ? "الهوية والعلامة" : "Branding & identity",
      pageDescription: isArabic
        ? "هذه الإعدادات تغذي شعار لوحة الإدارة والبوابة العميلية مباشرة."
        : "These settings feed the admin header, portal branding, and tenant identity directly.",
      companyName: isArabic ? "اسم الشركة" : "Company name",
      portalName: isArabic ? "اسم البوابة" : "Portal name",
      portalTagline: isArabic ? "العبارة التعريفية" : "Portal tagline",
      defaultCurrency: isArabic ? "العملة الافتراضية" : "Default currency",
      defaultLocale: isArabic ? "اللغة الافتراضية" : "Default locale",
      timezone: isArabic ? "المنطقة الزمنية" : "Timezone",
      logo: isArabic ? "الشعار" : "Logo",
      favicon: isArabic ? "الأيقونة" : "Favicon",
      saved: isArabic
        ? "تم تحديث الهوية والعلامة."
        : "Branding and tenant identity were updated.",
    },
    surface: {
      pageTitle: isArabic ? "سطح البوابة" : "Portal surface",
      pageDescription: isArabic
        ? "أظهر أو أخفِ أقسام البوابة واضبط ترتيبها والعناوين البديلة لكل مستأجر."
        : "Show or hide portal sections, change their order, and override labels per tenant.",
      navigation: isArabic ? "التنقل الجانبي" : "Navigation",
      homeSections: isArabic ? "أقسام الصفحة الرئيسية" : "Homepage sections",
      homeCards: isArabic ? "بطاقات الصفحة الرئيسية" : "Homepage cards",
      contentSources: isArabic ? "مصادر المحتوى" : "Content sources",
      saved: isArabic
        ? "تم تحديث إعدادات سطح البوابة."
        : "Portal surface settings were updated.",
      entries: {
        products: isArabic ? "المنتجات" : "Products",
        domains: isArabic ? "النطاقات" : "Domains",
        website_security: isArabic ? "الموقع والأمان" : "Website & Security",
        support: isArabic ? "الدعم" : "Support",
        domain_hero: isArabic ? "واجهة بحث النطاقات" : "Domain hero",
        quick_actions: isArabic ? "بطاقات الإجراءات" : "Quick actions",
        announcements: isArabic ? "الإعلانات" : "Announcements",
        knowledgebase: isArabic ? "قاعدة المعرفة" : "Knowledgebase",
        network_status: isArabic ? "حالة الشبكة" : "Network status",
        buy_domain: isArabic ? "شراء نطاق" : "Buy domain",
        hosting: isArabic ? "الاستضافة" : "Hosting",
        billing: isArabic ? "الفوترة" : "Billing",
        support_card: isArabic ? "الدعم" : "Support",
      },
      sourceLabels: {
        announcements: isArabic ? "الإعلانات" : "Announcements",
        knowledgebase: isArabic ? "قاعدة المعرفة" : "Knowledgebase",
        network_status: isArabic ? "حالة الشبكة" : "Network status",
        website_security: isArabic ? "الموقع والأمان" : "Website & Security",
        footer_links: isArabic ? "روابط التذييل" : "Footer links",
      },
    },
    content: {
      hubTitle: isArabic ? "إدارة محتوى البوابة" : "Portal content management",
      hubDescription: isArabic
        ? "أنشئ وحرر المحتوى الذي يراه العملاء داخل البوابة."
        : "Create and edit the content clients see throughout the portal.",
      announcementsTitle: isArabic
        ? "الإعلانات والأخبار"
        : "Announcements & news",
      announcementsDescription: isArabic
        ? "إعلانات البوابة العميلية والأخبار المنشورة."
        : "Client-facing portal announcements and published news.",
      knowledgebaseTitle: isArabic ? "قاعدة المعرفة" : "Knowledgebase",
      knowledgebaseDescription: isArabic
        ? "فئات المقالات والمحتوى الإرشادي باللغتين الإنجليزية والعربية."
        : "Category and article content for bilingual help documentation.",
      incidentsTitle: isArabic ? "حوادث الشبكة" : "Network incidents",
      incidentsDescription: isArabic
        ? "إشعارات الانقطاع والصيانة والحالة التشغيلية."
        : "Outage, maintenance, and operational status notices.",
      blocksTitle: isArabic ? "كتل المحتوى" : "Content blocks",
      blocksDescription: isArabic
        ? "محتوى الموقع والأمان والمقاطع التعريفية داخل البوابة."
        : "Website/security informational blocks and portal copy sections.",
      footerLinksTitle: isArabic ? "روابط التذييل" : "Footer links",
      footerLinksDescription: isArabic
        ? "روابط التذييل والروابط التعريفية داخل البوابة."
        : "Portal footer and informational links.",
    },
    announcements: {
      pageTitle: isArabic ? "الإعلانات والأخبار" : "Announcements & news",
      pageDescription: isArabic
        ? "انشر الأخبار والإعلانات التي تظهر في الصفحة الرئيسية وصفحة الأخبار داخل البوابة."
        : "Publish news and announcements that appear on the portal homepage and news page.",
    },
    knowledgebase: {
      pageTitle: isArabic ? "قاعدة المعرفة" : "Knowledgebase",
      pageDescription: isArabic
        ? "أدر فئات المقالات ومحتوى المساعدة المنشور للعملاء."
        : "Manage categories and published help articles for clients.",
      categoriesTitle: isArabic ? "الفئات" : "Categories",
      articlesTitle: isArabic ? "المقالات" : "Articles",
      nameEn: isArabic ? "الاسم بالإنجليزية" : "English name",
      nameAr: isArabic ? "الاسم بالعربية" : "Arabic name",
      categoryLabel: isArabic ? "الفئة" : "Category",
      noCategory: isArabic ? "بدون فئة" : "No category",
    },
    incidents: {
      pageTitle: isArabic ? "حوادث الشبكة" : "Network incidents",
      pageDescription: isArabic
        ? "أنشئ التحديثات العامة الخاصة بالحوادث والصيانة ومتابعة الحالة."
        : "Create public incident, maintenance, and monitoring updates.",
      summaryEn: isArabic ? "الملخص بالإنجليزية" : "English summary",
      summaryAr: isArabic ? "الملخص بالعربية" : "Arabic summary",
      detailsEn: isArabic ? "التفاصيل بالإنجليزية" : "English details",
      detailsAr: isArabic ? "التفاصيل بالعربية" : "Arabic details",
      severity: isArabic ? "الخطورة" : "Severity",
      isPublic: isArabic ? "مرئي للعملاء" : "Visible to clients",
      startedAt: isArabic ? "بدأت في" : "Started at",
      resolvedAt: isArabic ? "حُلّت في" : "Resolved at",
      statusLabels: {
        open: isArabic ? "مفتوح" : "Open",
        monitoring: isArabic ? "قيد المراقبة" : "Monitoring",
        maintenance: isArabic ? "صيانة" : "Maintenance",
        resolved: isArabic ? "محلول" : "Resolved",
      },
      severityLabels: {
        info: isArabic ? "معلوماتي" : "Info",
        warning: isArabic ? "تنبيه" : "Warning",
        critical: isArabic ? "حرجة" : "Critical",
      },
    },
    blocks: {
      pageTitle: isArabic ? "كتل المحتوى" : "Content blocks",
      pageDescription: isArabic
        ? "أدر المقاطع التعريفية والمحتوى النصي الذي يغذي صفحات البوابة المعلوماتية."
        : "Manage the informational text blocks that feed portal informational pages.",
      section: isArabic ? "القسم" : "Section",
      key: isArabic ? "المفتاح" : "Key",
      ctaLabelEn: isArabic ? "نص الرابط بالإنجليزية" : "English CTA label",
      ctaLabelAr: isArabic ? "نص الرابط بالعربية" : "Arabic CTA label",
      ctaHref: isArabic ? "وجهة الرابط" : "CTA href",
      sectionLabels: {
        website_security: isArabic ? "الموقع والأمان" : "Website & Security",
        homepage: isArabic ? "الصفحة الرئيسية" : "Homepage",
        support: isArabic ? "الدعم" : "Support",
      },
    },
    footer: {
      pageTitle: isArabic ? "روابط التذييل" : "Footer links",
      pageDescription: isArabic
        ? "تحكم في الروابط الظاهرة داخل تذييل البوابة وترتيبها."
        : "Control which links appear in the portal footer and in what order.",
      groupKey: isArabic ? "مجموعة الروابط" : "Link group",
      href: isArabic ? "الرابط" : "Href",
      openInNewTab: isArabic ? "يفتح في تبويب جديد" : "Open in new tab",
      isVisible: isArabic ? "إظهار الرابط" : "Show link",
      groupLabels: {
        company: isArabic ? "الشركة" : "Company",
        products: isArabic ? "المنتجات" : "Products",
        services: isArabic ? "الخدمات" : "Services",
        support: isArabic ? "الدعم" : "Support",
        resources: isArabic ? "الموارد" : "Resources",
      },
    },
    security: {
      pageTitle: isArabic ? "أمان الحساب" : "Account security",
      pageDescription: isArabic
        ? "أدر المصادقة الثنائية ورموز الاسترداد لحساب المشرف العام."
        : "Manage two-factor authentication and recovery codes for your super admin account.",
      mfaTitle: isArabic ? "المصادقة الثنائية" : "Two-Factor Authentication",
      mfaCardKicker: isArabic ? "أمان الحساب" : "Account security",
      securityCardTitle: isArabic ? "أمان الحساب" : "Account security",
      securityCardDescription: isArabic
        ? "أدر المصادقة الثنائية (TOTP) ورموز الاسترداد لحماية حساب المشرف العام."
        : "Manage TOTP-based two-factor authentication and recovery codes to protect your super admin account.",
      securityCardCta: isArabic ? "إدارة الأمان" : "Manage security",
    },
    statuses: {
      draft: isArabic ? "مسودة" : "Draft",
      published: isArabic ? "منشور" : "Published",
      archived: isArabic ? "مؤرشف" : "Archived",
      active: isArabic ? "نشط" : "Active",
      inactive: isArabic ? "غير نشط" : "Inactive",
    },
  } as const;
}
