"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { tenantAdminCopy } from "@/components/tenant-admin/copy";
import { StatusBanner } from "@/components/tenant-admin/status-banner";
import {
  deleteAdminResource,
  localizedValue,
  submitAdminJson,
  type KnowledgeBaseArticleRecord,
  type KnowledgeBaseCategoryRecord,
} from "@/lib/tenant-admin";

type KnowledgebaseManagerProps = {
  locale: string;
  categories: KnowledgeBaseCategoryRecord[];
  articles: KnowledgeBaseArticleRecord[];
};

type CategoryFormState = {
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  status: "active" | "inactive";
  sort_order: number;
};

type ArticleFormState = {
  category_id: string;
  title_en: string;
  title_ar: string;
  slug: string;
  excerpt_en: string;
  excerpt_ar: string;
  body_en: string;
  body_ar: string;
  status: "draft" | "published";
  is_featured: boolean;
  sort_order: number;
  published_at: string;
};

function emptyCategory(): CategoryFormState {
  return {
    name_en: "",
    name_ar: "",
    slug: "",
    description_en: "",
    description_ar: "",
    status: "active",
    sort_order: 0,
  };
}

function emptyArticle(): ArticleFormState {
  return {
    category_id: "",
    title_en: "",
    title_ar: "",
    slug: "",
    excerpt_en: "",
    excerpt_ar: "",
    body_en: "",
    body_ar: "",
    status: "draft",
    is_featured: false,
    sort_order: 0,
    published_at: "",
  };
}

function categoryToForm(category: KnowledgeBaseCategoryRecord): CategoryFormState {
  return {
    name_en: category.name_en,
    name_ar: category.name_ar ?? "",
    slug: category.slug,
    description_en: category.description_en ?? "",
    description_ar: category.description_ar ?? "",
    status: category.status as "active" | "inactive",
    sort_order: category.sort_order,
  };
}

function articleToForm(article: KnowledgeBaseArticleRecord): ArticleFormState {
  return {
    category_id: article.category_id ?? "",
    title_en: article.title_en,
    title_ar: article.title_ar ?? "",
    slug: article.slug,
    excerpt_en: article.excerpt_en ?? "",
    excerpt_ar: article.excerpt_ar ?? "",
    body_en: article.body_en,
    body_ar: article.body_ar ?? "",
    status: article.status as "draft" | "published",
    is_featured: article.is_featured,
    sort_order: article.sort_order,
    published_at: article.published_at ? article.published_at.slice(0, 16) : "",
  };
}

export function KnowledgebaseManager({
  locale,
  categories,
  articles,
}: KnowledgebaseManagerProps) {
  const copy = tenantAdminCopy(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [articleId, setArticleId] = useState<string | null>(articles[0]?.id ?? null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(
    categories[0] ? categoryToForm(categories[0]) : emptyCategory(),
  );
  const [articleForm, setArticleForm] = useState<ArticleFormState>(
    articles[0] ? articleToForm(articles[0]) : emptyArticle(),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === categoryId) ?? null,
    [categories, categoryId],
  );
  const selectedArticle = useMemo(
    () => articles.find((item) => item.id === articleId) ?? null,
    [articles, articleId],
  );

  function resetMessages() {
    setMessage(null);
    setError(null);
  }

  function loadCategory(category: KnowledgeBaseCategoryRecord | null) {
    setCategoryId(category?.id ?? null);
    setCategoryForm(category ? categoryToForm(category) : emptyCategory());
    resetMessages();
  }

  function loadArticle(article: KnowledgeBaseArticleRecord | null) {
    setArticleId(article?.id ?? null);
    setArticleForm(article ? articleToForm(article) : emptyArticle());
    resetMessages();
  }

  function saveCategory() {
    resetMessages();

    startTransition(async () => {
      const result = await submitAdminJson<KnowledgeBaseCategoryRecord>(
        categoryId ? `knowledgebase-categories/${categoryId}` : "knowledgebase-categories",
        categoryId ? "PUT" : "POST",
        {
          ...categoryForm,
          name_ar: categoryForm.name_ar || null,
          description_en: categoryForm.description_en || null,
          description_ar: categoryForm.description_ar || null,
        },
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(categoryId ? copy.common.updateSuccess : copy.common.createSuccess);
      router.refresh();
    });
  }

  function saveArticle() {
    resetMessages();

    startTransition(async () => {
      const result = await submitAdminJson<KnowledgeBaseArticleRecord>(
        articleId ? `knowledgebase-articles/${articleId}` : "knowledgebase-articles",
        articleId ? "PUT" : "POST",
        {
          ...articleForm,
          category_id: articleForm.category_id || null,
          title_ar: articleForm.title_ar || null,
          excerpt_en: articleForm.excerpt_en || null,
          excerpt_ar: articleForm.excerpt_ar || null,
          body_ar: articleForm.body_ar || null,
          published_at: articleForm.published_at || null,
        },
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(articleId ? copy.common.updateSuccess : copy.common.createSuccess);
      router.refresh();
    });
  }

  function deleteCategory() {
    if (!categoryId || !window.confirm(copy.common.deleteConfirm)) {
      return;
    }

    resetMessages();
    startTransition(async () => {
      const result = await deleteAdminResource(`knowledgebase-categories/${categoryId}`);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(copy.common.deleteSuccess);
      loadCategory(null);
      router.refresh();
    });
  }

  function deleteArticle() {
    if (!articleId || !window.confirm(copy.common.deleteConfirm)) {
      return;
    }

    resetMessages();
    startTransition(async () => {
      const result = await deleteAdminResource(`knowledgebase-articles/${articleId}`);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(copy.common.deleteSuccess);
      loadArticle(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      {(message || error) && (
        <div className="grid gap-3">
          {message ? <StatusBanner tone="success" message={message} /> : null}
          {error ? <StatusBanner tone="error" message={error} /> : null}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="glass-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#0a1628]">
              {copy.knowledgebase.categoriesTitle}
            </h2>
            <Button variant="outline" onClick={() => loadCategory(null)}>
              {copy.common.createNew}
            </Button>
          </div>

          <div className="mt-5 grid gap-3">
            {categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-[#faf9f5]/65 p-4 text-sm text-muted">
                {copy.common.emptyTitle}
              </div>
            ) : (
              categories.map((category) => {
                const active = category.id === categoryId;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => loadCategory(category)}
                    className={[
                      "rounded-2xl border px-4 py-4 text-start transition",
                      active
                        ? "border-[#bfd7ff] bg-[#eff6ff]"
                        : "border-line bg-[#faf9f5]/70 hover:bg-[#f4f8ff]",
                    ].join(" ")}
                  >
                    <p className="font-semibold text-[#0a1628]">
                      {localizedValue(locale, category.name_en, category.name_ar)}
                    </p>
                    <p className="mt-2 text-sm text-[#5f7389]">
                      {localizedValue(
                        locale,
                        category.description_en,
                        category.description_ar,
                      ) || category.slug}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.knowledgebase.nameEn}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                value={categoryForm.name_en}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name_en: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.knowledgebase.nameAr}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                dir="rtl"
                value={categoryForm.name_ar}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name_ar: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.common.slug}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                value={categoryForm.slug}
                onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.common.status}</span>
              <select
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                value={categoryForm.status}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    status: event.target.value as "active" | "inactive",
                  }))
                }
              >
                <option value="active">{copy.statuses.active}</option>
                <option value="inactive">{copy.statuses.inactive}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
              <span>{copy.common.descriptionEn}</span>
              <textarea
                className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                value={categoryForm.description_en}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, description_en: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
              <span>{copy.common.descriptionAr}</span>
              <textarea
                className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                dir="rtl"
                value={categoryForm.description_ar}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, description_ar: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.common.orderLabel}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                type="number"
                value={categoryForm.sort_order}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    sort_order: Number(event.target.value || "0"),
                  }))
                }
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button disabled={isPending} onClick={saveCategory}>
              {isPending ? copy.common.saving : copy.common.saveChanges}
            </Button>
            {selectedCategory ? (
              <Button variant="outline" disabled={isPending} onClick={deleteCategory}>
                {copy.common.deleteItem}
              </Button>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="glass-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#0a1628]">
              {copy.knowledgebase.articlesTitle}
            </h2>
            <Button variant="outline" onClick={() => loadArticle(null)}>
              {copy.common.createNew}
            </Button>
          </div>

          <div className="mt-5 grid gap-3">
            {articles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-[#faf9f5]/65 p-4 text-sm text-muted">
                {copy.common.emptyTitle}
              </div>
            ) : (
              articles.map((article) => {
                const active = article.id === articleId;

                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => loadArticle(article)}
                    className={[
                      "rounded-2xl border px-4 py-4 text-start transition",
                      active
                        ? "border-[#bfd7ff] bg-[#eff6ff]"
                        : "border-line bg-[#faf9f5]/70 hover:bg-[#f4f8ff]",
                    ].join(" ")}
                  >
                    <p className="font-semibold text-[#0a1628]">
                      {localizedValue(locale, article.title_en, article.title_ar)}
                    </p>
                    <p className="mt-2 text-sm text-[#5f7389]">
                      {localizedValue(
                        locale,
                        article.excerpt_en,
                        article.excerpt_ar,
                      ) || article.slug}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.knowledgebase.categoryLabel}</span>
              <select
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                value={articleForm.category_id}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, category_id: event.target.value }))
                }
              >
                <option value="">{copy.knowledgebase.noCategory}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {localizedValue(locale, category.name_en, category.name_ar)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.common.status}</span>
              <select
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                value={articleForm.status}
                onChange={(event) =>
                  setArticleForm((current) => ({
                    ...current,
                    status: event.target.value as "draft" | "published",
                  }))
                }
              >
                <option value="draft">{copy.statuses.draft}</option>
                <option value="published">{copy.statuses.published}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.common.titleEn}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                value={articleForm.title_en}
                onChange={(event) => setArticleForm((current) => ({ ...current, title_en: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.common.titleAr}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                dir="rtl"
                value={articleForm.title_ar}
                onChange={(event) => setArticleForm((current) => ({ ...current, title_ar: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.common.slug}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                value={articleForm.slug}
                onChange={(event) => setArticleForm((current) => ({ ...current, slug: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.common.publishedAt}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                type="datetime-local"
                value={articleForm.published_at}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, published_at: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
              <span>{copy.common.excerptEn}</span>
              <textarea
                className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                value={articleForm.excerpt_en}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, excerpt_en: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
              <span>{copy.common.excerptAr}</span>
              <textarea
                className="min-h-24 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                dir="rtl"
                value={articleForm.excerpt_ar}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, excerpt_ar: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
              <span>{copy.common.bodyEn}</span>
              <textarea
                className="min-h-40 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                value={articleForm.body_en}
                onChange={(event) => setArticleForm((current) => ({ ...current, body_en: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
              <span>{copy.common.bodyAr}</span>
              <textarea
                className="min-h-40 rounded-[1.5rem] border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                dir="rtl"
                value={articleForm.body_ar}
                onChange={(event) => setArticleForm((current) => ({ ...current, body_ar: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>{copy.common.orderLabel}</span>
              <input
                className="rounded-2xl border border-line bg-[#faf9f5]/85 px-4 py-3 outline-none transition focus:border-accent"
                type="number"
                value={articleForm.sort_order}
                onChange={(event) =>
                  setArticleForm((current) => ({
                    ...current,
                    sort_order: Number(event.target.value || "0"),
                  }))
                }
              />
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={articleForm.is_featured}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, is_featured: event.target.checked }))
                }
              />
              <span>{copy.common.featured}</span>
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button disabled={isPending} onClick={saveArticle}>
              {isPending ? copy.common.saving : copy.common.saveChanges}
            </Button>
            {selectedArticle ? (
              <Button variant="outline" disabled={isPending} onClick={deleteArticle}>
                {copy.common.deleteItem}
              </Button>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
