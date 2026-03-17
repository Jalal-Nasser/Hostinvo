"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { backendOrigin } from "@/lib/auth";
import {
  type ProductGroupFormPayload,
  type ProductGroupRecord,
  type ProductGroupStatus,
  type VisibilityOption,
} from "@/lib/catalog";

type ProductGroupManagerProps = {
  initialGroups: ProductGroupRecord[];
};

type ProductGroupFormState = {
  name: string;
  slug: string;
  description: string;
  status: ProductGroupStatus;
  visibility: VisibilityOption;
  display_order: number;
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

function initialState(): ProductGroupFormState {
  return {
    name: "",
    slug: "",
    description: "",
    status: "active",
    visibility: "public",
    display_order: 0,
  };
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

function normalizePayload(state: ProductGroupFormState): ProductGroupFormPayload {
  return {
    name: state.name.trim(),
    slug: state.slug.trim() || null,
    description: state.description.trim() || null,
    status: state.status,
    visibility: state.visibility,
    display_order: Number.isFinite(Number(state.display_order)) ? Number(state.display_order) : 0,
  };
}

export function ProductGroupManager({ initialGroups }: ProductGroupManagerProps) {
  const t = useTranslations("Catalog");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [groups, setGroups] = useState(initialGroups);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<ProductGroupFormState>(initialState);
  const [editForm, setEditForm] = useState<ProductGroupFormState>(initialState);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function beginEdit(group: ProductGroupRecord) {
    setEditingId(group.id);
    setEditForm({
      name: group.name,
      slug: group.slug,
      description: group.description ?? "",
      status: group.status,
      visibility: group.visibility,
      display_order: group.display_order,
    });
    setMessage(null);
    setError(null);
  }

  function endEdit() {
    setEditingId(null);
    setEditForm(initialState());
  }

  async function submit(mode: "create" | "edit", groupId?: string) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const payload = normalizePayload(mode === "create" ? createForm : editForm);
        const response = await fetch(
          mode === "create"
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/product-groups`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/product-groups/${groupId}`,
          {
            method: mode === "create" ? "POST" : "PUT",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("saveError"));
          return;
        }

        const responsePayload = (await response.json()) as { data: ProductGroupRecord };

        setGroups((current) => {
          if (mode === "create") {
            return [...current, responsePayload.data].sort(
              (left, right) => left.display_order - right.display_order || left.name.localeCompare(right.name),
            );
          }

          return current
            .map((group) => (group.id === responsePayload.data.id ? responsePayload.data : group))
            .sort((left, right) => left.display_order - right.display_order || left.name.localeCompare(right.name));
        });

        if (mode === "create") {
          setCreateForm(initialState());
          setMessage(t("groupCreateSuccess"));
          router.refresh();
          return;
        }

        endEdit();
        setMessage(t("groupUpdateSuccess"));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  function remove(groupId: string) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await ensureCsrfCookie();

        const xsrfToken = readCookie("XSRF-TOKEN");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/product-groups/${groupId}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
          },
        );

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as
            | { message?: string; errors?: Record<string, string[]> }
            | null;

          setError(firstErrorFromPayload(errorPayload) ?? t("deleteError"));
          return;
        }

        setGroups((current) => current.filter((group) => group.id !== groupId));
        endEdit();
        setMessage(t("groupDeleteSuccess"));
        router.refresh();
      } catch {
        setError(t("serviceUnavailable"));
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("groupCreateTitle")}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{t("groupCreateDescription")}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("groupNameLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
              value={createForm.name}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("slugLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) => setCreateForm((current) => ({ ...current, slug: event.target.value }))}
              value={createForm.slug}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("statusLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  status: event.target.value as ProductGroupStatus,
                }))
              }
              value={createForm.status}
            >
              <option value="active">{t("statusActive")}</option>
              <option value="inactive">{t("statusInactive")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("visibilityLabel")}</span>
            <select
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  visibility: event.target.value as VisibilityOption,
                }))
              }
              value={createForm.visibility}
            >
              <option value="public">{t("visibilityPublic")}</option>
              <option value="private">{t("visibilityPrivate")}</option>
              <option value="hidden">{t("visibilityHidden")}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
            <span>{t("descriptionLabel")}</span>
            <textarea
              className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, description: event.target.value }))
              }
              value={createForm.description}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>{t("displayOrderLabel")}</span>
            <input
              className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
              min={0}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  display_order: Number(event.target.value) || 0,
                }))
              }
              type="number"
              value={createForm.display_order}
            />
          </label>
        </div>

        <div className="mt-6">
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() => submit("create")}
            type="button"
          >
            {isPending ? t("saving") : t("createGroupButton")}
          </button>
        </div>
      </section>

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

      <section className="grid gap-4">
        {groups.length === 0 ? (
          <article className="glass-card p-8">
            <h2 className="text-2xl font-semibold text-foreground">{t("groupsEmptyTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{t("groupsEmptyDescription")}</p>
          </article>
        ) : (
          groups.map((group) => {
            const isEditing = editingId === group.id;

            return (
              <article key={group.id} className="glass-card p-6 md:p-8">
                {isEditing ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{t("groupNameLabel")}</span>
                      <input
                        className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, name: event.target.value }))
                        }
                        value={editForm.name}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{t("slugLabel")}</span>
                      <input
                        className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, slug: event.target.value }))
                        }
                        value={editForm.slug}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{t("statusLabel")}</span>
                      <select
                        className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            status: event.target.value as ProductGroupStatus,
                          }))
                        }
                        value={editForm.status}
                      >
                        <option value="active">{t("statusActive")}</option>
                        <option value="inactive">{t("statusInactive")}</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{t("visibilityLabel")}</span>
                      <select
                        className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            visibility: event.target.value as VisibilityOption,
                          }))
                        }
                        value={editForm.visibility}
                      >
                        <option value="public">{t("visibilityPublic")}</option>
                        <option value="private">{t("visibilityPrivate")}</option>
                        <option value="hidden">{t("visibilityHidden")}</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                      <span>{t("descriptionLabel")}</span>
                      <textarea
                        className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, description: event.target.value }))
                        }
                        value={editForm.description}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>{t("displayOrderLabel")}</span>
                      <input
                        className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                        min={0}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            display_order: Number(event.target.value) || 0,
                          }))
                        }
                        type="number"
                        value={editForm.display_order}
                      />
                    </label>

                    <div className="flex flex-wrap items-end gap-3">
                      <button
                        className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isPending}
                        onClick={() => submit("edit", group.id)}
                        type="button"
                      >
                        {isPending ? t("saving") : t("saveButton")}
                      </button>
                      <button
                        className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                        onClick={endEdit}
                        type="button"
                      >
                        {t("cancelButton")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold text-foreground">{group.name}</h2>
                        <span className="rounded-full border border-line bg-[#faf9f5]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                          {group.status === "active" ? t("statusActive") : t("statusInactive")}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted">{group.slug}</p>
                      <p className="mt-2 text-sm leading-7 text-muted">{group.description ?? t("notAvailable")}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="rounded-full border border-line bg-[#faf9f5]/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
                        onClick={() => beginEdit(group)}
                        type="button"
                      >
                        {t("editGroupButton")}
                      </button>
                      <button
                        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        disabled={isPending}
                        onClick={() => remove(group.id)}
                        type="button"
                      >
                        {t("deleteGroupButton")}
                      </button>
                    </div>
                  </div>
                )}

                {!isEditing ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("visibilityLabel")}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {group.visibility === "public"
                          ? t("visibilityPublic")
                          : group.visibility === "private"
                            ? t("visibilityPrivate")
                            : t("visibilityHidden")}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("displayOrderLabel")}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{group.display_order}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("groupProductsCountLabel")}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{group.products_count ?? 0}</p>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
