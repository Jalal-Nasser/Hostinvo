"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { backendOrigin, localePath } from "@/lib/auth";
import {
  configurableOptionTypes,
  productPaymentTypes,
  productStatuses,
  productQuantityModes,
  productTypes,
  provisioningModules,
  type ConfigurableOptionChoiceRecord,
  type ConfigurableOptionRecord,
  type ConfigurableOptionType,
  type ProductGroupRecord,
  type ProductRecord,
  type ProductStatus,
  type ProductType,
  type ProductPaymentType,
  type ProductQuantityMode,
  type ProvisioningModule,
  type VisibilityOption,
  visibilityOptions,
} from "@/lib/catalog";
import { type ServerRecord } from "@/lib/provisioning";

type ProductFormProps = {
  mode: "create" | "edit";
  groups: ProductGroupRecord[];
  servers?: ServerRecord[];
  initialProduct?: ProductRecord;
  activeSection?: "details" | "module" | "configurable-options" | "other";
};

type ConfigurableOptionChoiceState = ConfigurableOptionChoiceRecord;

type ConfigurableOptionState = Omit<ConfigurableOptionRecord, "description"> & {
  description: string;
};

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

async function ensureCsrfCookie() {
  await fetch(`${backendOrigin}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}

function nullable(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  return normalized === "" ? null : normalized;
}

function firstErrorFromPayload(payload: {
  message?: string;
  errors?: Record<string, string[]>;
} | null) {
  if (payload?.message) {
    return payload.message;
  }

  if (!payload?.errors) {
    return null;
  }

  const firstField = Object.values(payload.errors)[0];

  return firstField?.[0] ?? null;
}

function emptyChoice(): ConfigurableOptionChoiceState {
  return {
    label: "",
    value: "",
    is_default: false,
    display_order: 0,
  };
}

function emptyOption(): ConfigurableOptionState {
  return {
    name: "",
    code: "",
    option_type: "select",
    description: "",
    status: "active",
    is_required: false,
    display_order: 0,
    choices: [emptyChoice()],
  };
}

function choiceTypesRequireList(optionType: ConfigurableOptionType): boolean {
  return optionType === "select" || optionType === "radio";
}

export function ProductForm({
  mode,
  groups,
  servers = [],
  initialProduct,
  activeSection = "details",
}: ProductFormProps) {
  const t = useTranslations("Catalog");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [groupId, setGroupId] = useState(initialProduct?.product_group_id ?? "");
  const [serverId, setServerId] = useState(initialProduct?.server_id?.toString() ?? "");
  const [type, setType] = useState<ProductType>(initialProduct?.type ?? "hosting");
  const [provisioningModule, setProvisioningModule] = useState<ProvisioningModule | "">(
    initialProduct?.provisioning_module ?? "",
  );
  const [provisioningPackage, setProvisioningPackage] = useState(
    initialProduct?.provisioning_package ?? "",
  );
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [tagline, setTagline] = useState(initialProduct?.tagline ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [sku, setSku] = useState(initialProduct?.sku ?? "");
  const [summary, setSummary] = useState(initialProduct?.summary ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [color, setColor] = useState(initialProduct?.color ?? "");
  const [status, setStatus] = useState<ProductStatus>(initialProduct?.status ?? "draft");
  const [visibility, setVisibility] = useState<VisibilityOption>(
    initialProduct?.visibility ?? "public",
  );
  const [displayOrder, setDisplayOrder] = useState(initialProduct?.display_order ?? 0);
  const [isFeatured, setIsFeatured] = useState(initialProduct?.is_featured ?? false);
  const [welcomeEmail, setWelcomeEmail] = useState(initialProduct?.welcome_email ?? "");
  const [requireDomain, setRequireDomain] = useState(initialProduct?.require_domain ?? false);
  const [stockControl, setStockControl] = useState(initialProduct?.stock_control ?? false);
  const [stockQuantity, setStockQuantity] = useState(initialProduct?.stock_quantity ?? 0);
  const [applyTax, setApplyTax] = useState(initialProduct?.apply_tax ?? false);
  const [retired, setRetired] = useState(initialProduct?.retired ?? false);
  const [paymentType, setPaymentType] = useState<ProductPaymentType>(
    initialProduct?.payment_type ?? "recurring",
  );
  const [quantityMode, setQuantityMode] = useState<ProductQuantityMode>(
    initialProduct?.allow_multiple_quantities ?? "no",
  );
  const [recurringCyclesLimit, setRecurringCyclesLimit] = useState(
    initialProduct?.recurring_cycles_limit ?? 0,
  );
  const [autoTerminateDays, setAutoTerminateDays] = useState(
    initialProduct?.auto_terminate_days ?? 0,
  );
  const [terminationEmail, setTerminationEmail] = useState(initialProduct?.termination_email ?? "");
  const [prorataBilling, setProrataBilling] = useState(initialProduct?.prorata_billing ?? false);
  const [prorataDate, setProrataDate] = useState(initialProduct?.prorata_date ?? 1);
  const [chargeNextMonth, setChargeNextMonth] = useState(initialProduct?.charge_next_month ?? 0);
  const [configurableOptions, setConfigurableOptions] = useState<ConfigurableOptionState[]>(
    initialProduct?.configurable_options?.map((option, optionIndex) => ({
      id: option.id,
      name: option.name,
      code: option.code,
      option_type: option.option_type,
      description: option.description ?? "",
      status: option.status,
      is_required: option.is_required,
      display_order: option.display_order ?? optionIndex,
      choices:
        option.choices?.map((choice, choiceIndex) => ({
          id: choice.id,
          label: choice.label,
          value: choice.value,
          is_default: choice.is_default,
          display_order: choice.display_order ?? choiceIndex,
        })) ?? [],
    })) ?? [],
  );

  const typeLabels: Record<ProductType, string> = {
    hosting: t("typeHosting"),
  };

  const statusLabels: Record<ProductStatus, string> = {
    draft: t("statusDraft"),
    active: t("statusActive"),
    inactive: t("statusInactive"),
    archived: t("statusArchived"),
  };

  const visibilityLabels: Record<VisibilityOption, string> = {
    public: t("visibilityPublic"),
    private: t("visibilityPrivate"),
    hidden: t("visibilityHidden"),
  };

  const moduleLabels: Record<ProvisioningModule, string> = {
    cpanel: t("moduleCpanel"),
    plesk: t("modulePlesk"),
    directadmin: t("moduleDirectadmin"),
    custom: t("moduleCustom"),
  };

  const paymentTypeLabels: Record<ProductPaymentType, string> = {
    free: t("paymentTypeFree"),
    onetime: t("paymentTypeOneTime"),
    recurring: t("paymentTypeRecurring"),
  };

  const quantityModeLabels: Record<ProductQuantityMode, string> = {
    no: t("quantityModeNo"),
    multiple_services: t("quantityModeMultipleServices"),
    scalable: t("quantityModeScalable"),
  };

  const optionTypeLabels: Record<ConfigurableOptionType, string> = {
    select: t("optionTypeSelect"),
    radio: t("optionTypeRadio"),
    quantity: t("optionTypeQuantity"),
    yes_no: t("optionTypeYesNo"),
  };

  function updateOption(
    index: number,
    updater: (option: ConfigurableOptionState) => ConfigurableOptionState,
  ) {
    setConfigurableOptions((current) =>
      current.map((option, itemIndex) => (itemIndex === index ? updater(option) : option)),
    );
  }

  function updateChoice(
    optionIndex: number,
    choiceIndex: number,
    updater: (choice: ConfigurableOptionChoiceState) => ConfigurableOptionChoiceState,
  ) {
    updateOption(optionIndex, (option) => ({
      ...option,
      choices: option.choices.map((choice, itemIndex) =>
        itemIndex === choiceIndex ? updater(choice) : choice,
      ),
    }));
  }

  function normalizePayload() {
    return {
      product_group_id: groupId || null,
      server_id: serverId ? Number(serverId) : null,
      type,
      provisioning_module: provisioningModule || null,
      provisioning_package: nullable(provisioningPackage),
      name: name.trim(),
      tagline: nullable(tagline),
      slug: nullable(slug),
      sku: nullable(sku),
      summary: nullable(summary),
      description: nullable(description),
      color: nullable(color),
      status,
      visibility,
      display_order: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
      is_featured: isFeatured,
      welcome_email: nullable(welcomeEmail),
      require_domain: requireDomain,
      stock_control: stockControl,
      stock_quantity: stockControl ? Number(stockQuantity || 0) : null,
      apply_tax: applyTax,
      retired: retired,
      payment_type: paymentType,
      allow_multiple_quantities: quantityMode,
      recurring_cycles_limit:
        paymentType === "recurring" ? Number(recurringCyclesLimit || 0) : null,
      auto_terminate_days: Number(autoTerminateDays || 0),
      termination_email: nullable(terminationEmail),
      prorata_billing: prorataBilling,
      prorata_date: prorataBilling ? Number(prorataDate || 1) : null,
      charge_next_month: prorataBilling ? Number(chargeNextMonth || 0) : null,
      configurable_options: configurableOptions.map((option, optionIndex) => ({
        id: option.id,
        name: option.name.trim(),
        code: nullable(option.code),
        option_type: option.option_type,
        description: nullable(option.description),
        status: option.status,
        is_required: option.is_required,
        display_order: Number.isFinite(Number(option.display_order))
          ? Number(option.display_order)
          : optionIndex,
        choices: choiceTypesRequireList(option.option_type)
          ? option.choices.map((choice, choiceIndex) => ({
              id: choice.id,
              label: choice.label.trim(),
              value: nullable(choice.value),
              is_default: choice.is_default,
              display_order: Number.isFinite(Number(choice.display_order))
                ? Number(choice.display_order)
                : choiceIndex,
            }))
          : [],
      })),
    };
  }

  function handleSubmit() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          mode === "create"
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/${initialProduct?.id}`,
          {
            method: mode === "create" ? "POST" : "PUT",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify(normalizePayload()),
          },
        );

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("saveError"));
          return;
        }

        const responsePayload = (await response.json()) as { data: ProductRecord };
        const targetProductId = responsePayload.data.id;

        if (mode === "create") {
          router.replace(localePath(locale, `/dashboard/products/${targetProductId}/pricing`));
          router.refresh();
          return;
        }

        setMessage(t("productUpdateSuccess"));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  const cancelHref =
    mode === "create"
      ? localePath(locale, "/dashboard/products")
      : localePath(locale, `/dashboard/products/${initialProduct?.id}/pricing`);

  return (
    <div className="grid gap-6">
      {(activeSection === "details" || activeSection === "module" || activeSection === "other") ? (
      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          {activeSection === "details" ? (
            <>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("productGroupLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setGroupId(event.target.value)}
              value={groupId}
            >
              <option value="">{t("ungroupedOption")}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("typeLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setType(event.target.value as ProductType)}
              value={type}
            >
              {productTypes.map((productType) => (
                <option key={productType} value={productType}>
                  {typeLabels[productType]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("productNameLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("taglineLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setTagline(event.target.value)}
              value={tagline}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("slugLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setSlug(event.target.value)}
              value={slug}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("skuLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setSku(event.target.value)}
              value={sku}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("summaryLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setSummary(event.target.value)}
              value={summary}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("descriptionLabel")}</span>
            <textarea
              className="min-h-28 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("colorLabel")}</span>
            <input
              className="h-12 rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-2 outline-none transition focus:border-accent"
              onChange={(event) => setColor(event.target.value)}
              type="color"
              value={color || "#7c3aed"}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("welcomeEmailLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setWelcomeEmail(event.target.value)}
              value={welcomeEmail}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setStatus(event.target.value as ProductStatus)}
              value={status}
            >
              {productStatuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("visibilityLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setVisibility(event.target.value as VisibilityOption)}
              value={visibility}
            >
              {visibilityOptions.map((value) => (
                <option key={value} value={value}>
                  {visibilityLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("displayOrderLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              min={0}
              onChange={(event) => setDisplayOrder(Number(event.target.value) || 0)}
              type="number"
              value={displayOrder}
            />
          </label>

          <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm text-muted">
              <input
                checked={requireDomain}
                className="h-4 w-4 rounded border-line"
                onChange={(event) => setRequireDomain(event.target.checked)}
                type="checkbox"
              />
              <span>{t("requireDomainLabel")}</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-muted">
              <input
                checked={applyTax}
                className="h-4 w-4 rounded border-line"
                onChange={(event) => setApplyTax(event.target.checked)}
                type="checkbox"
              />
              <span>{t("applyTaxLabel")}</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-muted">
              <input
                checked={isFeatured}
                className="h-4 w-4 rounded border-line"
                onChange={(event) => setIsFeatured(event.target.checked)}
                type="checkbox"
              />
              <span>{t("featuredLabel")}</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-muted">
              <input
                checked={retired}
                className="h-4 w-4 rounded border-line"
                onChange={(event) => setRetired(event.target.checked)}
                type="checkbox"
              />
              <span>{t("retiredLabel")}</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-muted">
              <input
                checked={stockControl}
                className="h-4 w-4 rounded border-line"
                onChange={(event) => setStockControl(event.target.checked)}
                type="checkbox"
              />
              <span>{t("stockControlLabel")}</span>
            </label>
            {stockControl ? (
              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>{t("stockQuantityLabel")}</span>
                <input
                  className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                  min={0}
                  onChange={(event) => setStockQuantity(Number(event.target.value) || 0)}
                  type="number"
                  value={stockQuantity}
                />
              </label>
            ) : null}
          </div>
            </>
          ) : null}

          {activeSection === "module" ? (
            <>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("linkedServerLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => {
                const nextServerId = event.target.value;
                const server = servers.find((item) => item.id.toString() === nextServerId);

                setServerId(nextServerId);

                if (server && !provisioningModule) {
                  setProvisioningModule(server.panel_type as ProvisioningModule);
                }
              }}
              value={serverId}
            >
              <option value="">{t("noServerOption")}</option>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name} ({server.hostname})
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("provisioningModuleLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setProvisioningModule(event.target.value as ProvisioningModule | "")}
              value={provisioningModule}
            >
              <option value="">{t("noModuleOption")}</option>
              {provisioningModules.map((value) => (
                <option key={value} value={value}>
                  {moduleLabels[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("provisioningPackageLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setProvisioningPackage(event.target.value)}
              value={provisioningPackage}
            />
          </label>
            </>
          ) : null}

          {activeSection === "other" ? (
            <>
              <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                <span>{t("paymentTypeLabel")}</span>
                <div className="flex flex-wrap gap-4 rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3">
                  {productPaymentTypes.map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        checked={paymentType === value}
                        onChange={() => setPaymentType(value)}
                        type="radio"
                      />
                      <span>{paymentTypeLabels[value]}</span>
                    </label>
                  ))}
                </div>
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                <span>{t("quantityModeLabel")}</span>
                <div className="grid gap-2 rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3">
                  {productQuantityModes.map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        checked={quantityMode === value}
                        onChange={() => setQuantityMode(value)}
                        type="radio"
                      />
                      <span>{quantityModeLabels[value]}</span>
                    </label>
                  ))}
                </div>
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>{t("recurringCyclesLimitLabel")}</span>
                <input
                  className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                  min={0}
                  onChange={(event) => setRecurringCyclesLimit(Number(event.target.value) || 0)}
                  type="number"
                  value={recurringCyclesLimit}
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>{t("autoTerminateDaysLabel")}</span>
                <input
                  className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                  min={0}
                  onChange={(event) => setAutoTerminateDays(Number(event.target.value) || 0)}
                  type="number"
                  value={autoTerminateDays}
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>{t("terminationEmailLabel")}</span>
                <input
                  className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                  onChange={(event) => setTerminationEmail(event.target.value)}
                  value={terminationEmail}
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-muted">
                <input
                  checked={prorataBilling}
                  className="h-4 w-4 rounded border-line"
                  onChange={(event) => setProrataBilling(event.target.checked)}
                  type="checkbox"
                />
                <span>{t("prorataBillingLabel")}</span>
              </label>

              {prorataBilling ? (
                <>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("prorataDateLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                      max={31}
                      min={1}
                      onChange={(event) => setProrataDate(Number(event.target.value) || 1)}
                      type="number"
                      value={prorataDate}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>{t("chargeNextMonthLabel")}</span>
                    <input
                      className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                      max={31}
                      min={0}
                      onChange={(event) => setChargeNextMonth(Number(event.target.value) || 0)}
                      type="number"
                      value={chargeNextMonth}
                    />
                  </label>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
      ) : null}

      {activeSection === "configurable-options" ? (
      <section className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {t("configurableOptionsSection")}
            </h2>
            <p className="mt-2 text-sm text-muted">{t("configurableOptionsDescription")}</p>
          </div>

          <button
            className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            onClick={() =>
              setConfigurableOptions((current) => [
                ...current,
                { ...emptyOption(), display_order: current.length },
              ])
            }
            type="button"
          >
            {t("addOption")}
          </button>
        </div>

        {configurableOptions.length === 0 ? (
          <p className="mt-6 text-sm text-muted">{t("noOptions")}</p>
        ) : (
          <div className="mt-6 grid gap-4">
            {configurableOptions.map((option, optionIndex) => {
              const showChoices = choiceTypesRequireList(option.option_type);

              return (
                <article
                  key={option.id ?? `option-${optionIndex}`}
                  className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground">
                      {t("optionCardTitle", { number: optionIndex + 1 })}
                    </p>
                    <button
                      className="text-sm font-medium text-red-700"
                      onClick={() =>
                        setConfigurableOptions((current) =>
                          current.filter((_, itemIndex) => itemIndex !== optionIndex),
                        )
                      }
                      type="button"
                    >
                      {t("removeOption")}
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{t("optionNameLabel")}</span>
                      <input
                        className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(event) =>
                          updateOption(optionIndex, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        value={option.name}
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{t("optionCodeLabel")}</span>
                      <input
                        className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(event) =>
                          updateOption(optionIndex, (current) => ({
                            ...current,
                            code: event.target.value,
                          }))
                        }
                        value={option.code}
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{t("optionTypeLabel")}</span>
                      <select
                        className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(event) =>
                          updateOption(optionIndex, (current) => ({
                            ...current,
                            option_type: event.target.value as ConfigurableOptionType,
                            choices:
                              choiceTypesRequireList(event.target.value as ConfigurableOptionType) &&
                              current.choices.length === 0
                                ? [emptyChoice()]
                                : choiceTypesRequireList(event.target.value as ConfigurableOptionType)
                                  ? current.choices
                                  : [],
                          }))
                        }
                        value={option.option_type}
                      >
                        {configurableOptionTypes.map((optionType) => (
                          <option key={optionType} value={optionType}>
                            {optionTypeLabels[optionType]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{t("statusLabel")}</span>
                      <select
                        className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(event) =>
                          updateOption(optionIndex, (current) => ({
                            ...current,
                            status: event.target.value as "active" | "inactive",
                          }))
                        }
                        value={option.status}
                      >
                        <option value="active">{t("statusActive")}</option>
                        <option value="inactive">{t("statusInactive")}</option>
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                      <span>{t("descriptionLabel")}</span>
                      <textarea
                        className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(event) =>
                          updateOption(optionIndex, (current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        value={option.description}
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{t("displayOrderLabel")}</span>
                      <input
                        className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                        min={0}
                        onChange={(event) =>
                          updateOption(optionIndex, (current) => ({
                            ...current,
                            display_order: Number(event.target.value) || 0,
                          }))
                        }
                        type="number"
                        value={option.display_order}
                      />
                    </label>
                  </div>

                  <label className="mt-4 flex items-center gap-3 text-sm text-muted">
                    <input
                      checked={option.is_required}
                      className="h-4 w-4 rounded border-line"
                      onChange={(event) =>
                        updateOption(optionIndex, (current) => ({
                          ...current,
                          is_required: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>{t("requiredLabel")}</span>
                  </label>

                  {showChoices ? (
                    <div className="mt-6 rounded-[1.5rem] border border-dashed border-line bg-[#fffdf8] p-5">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          {t("choicesSection")}
                        </h3>
                        <button
                          className="rounded-full border border-line bg-[#faf9f5] px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                          onClick={() =>
                            updateOption(optionIndex, (current) => ({
                              ...current,
                              choices: [
                                ...current.choices,
                                {
                                  ...emptyChoice(),
                                  display_order: current.choices.length,
                                },
                              ],
                            }))
                          }
                          type="button"
                        >
                          {t("addChoice")}
                        </button>
                      </div>

                      {option.choices.length === 0 ? (
                        <p className="mt-4 text-sm text-muted">{t("noChoices")}</p>
                      ) : (
                        <div className="mt-4 grid gap-4">
                          {option.choices.map((choice, choiceIndex) => (
                            <div
                              key={choice.id ?? `choice-${choiceIndex}`}
                              className="rounded-[1.25rem] border border-line bg-[#faf9f5] p-4"
                            >
                              <div className="grid gap-4 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium text-foreground">
                                  <span>{t("choiceLabelLabel")}</span>
                                  <input
                                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                                    onChange={(event) =>
                                      updateChoice(optionIndex, choiceIndex, (current) => ({
                                        ...current,
                                        label: event.target.value,
                                      }))
                                    }
                                    value={choice.label}
                                  />
                                </label>

                                <label className="grid gap-2 text-sm font-medium text-foreground">
                                  <span>{t("choiceValueLabel")}</span>
                                  <input
                                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                                    onChange={(event) =>
                                      updateChoice(optionIndex, choiceIndex, (current) => ({
                                        ...current,
                                        value: event.target.value,
                                      }))
                                    }
                                    value={choice.value}
                                  />
                                </label>

                                <label className="grid gap-2 text-sm font-medium text-foreground">
                                  <span>{t("displayOrderLabel")}</span>
                                  <input
                                    className="rounded-2xl border border-line bg-[#faf9f5] px-4 py-3 outline-none transition focus:border-accent"
                                    min={0}
                                    onChange={(event) =>
                                      updateChoice(optionIndex, choiceIndex, (current) => ({
                                        ...current,
                                        display_order: Number(event.target.value) || 0,
                                      }))
                                    }
                                    type="number"
                                    value={choice.display_order}
                                  />
                                </label>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-4">
                                <label className="flex items-center gap-3 text-sm text-muted">
                                  <input
                                    checked={choice.is_default}
                                    className="h-4 w-4 rounded border-line"
                                    onChange={(event) =>
                                      updateOption(optionIndex, (current) => ({
                                        ...current,
                                        choices: current.choices.map((item, itemIndex) => ({
                                          ...item,
                                          is_default:
                                            itemIndex === choiceIndex
                                              ? event.target.checked
                                              : false,
                                        })),
                                      }))
                                    }
                                    type="checkbox"
                                  />
                                  <span>{t("defaultChoiceLabel")}</span>
                                </label>

                                <button
                                  className="text-sm font-medium text-red-700"
                                  onClick={() =>
                                    updateOption(optionIndex, (current) => ({
                                      ...current,
                                      choices: current.choices.filter(
                                        (_, itemIndex) => itemIndex !== choiceIndex,
                                      ),
                                    }))
                                  }
                                  type="button"
                                >
                                  {t("removeChoice")}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={handleSubmit}
          type="button"
        >
          {isPending
            ? t("saving")
            : mode === "create"
              ? t("createProductButton")
              : t("saveButton")}
        </button>

        <Link
          className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
          href={cancelHref}
        >
          {t("cancelButton")}
        </Link>
      </div>
    </div>
  );
}
