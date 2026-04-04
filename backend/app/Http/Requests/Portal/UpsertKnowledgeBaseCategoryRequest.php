<?php

namespace App\Http\Requests\Portal;

use App\Models\KnowledgeBaseCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertKnowledgeBaseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $category = $this->route('knowledgebaseCategory');

        return $category
            ? $this->user()->can('update', $category)
            : $this->user()->can('create', KnowledgeBaseCategory::class);
    }

    public function rules(): array
    {
        $categoryId = $this->route('knowledgebaseCategory')?->id;
        $tenantId = $this->user()?->tenant_id;

        return [
            'slug' => [
                'nullable',
                'string',
                'max:160',
                'alpha_dash',
                Rule::unique('knowledge_base_categories', 'slug')->ignore($categoryId)->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'name_en' => ['required', 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'description_en' => ['nullable', 'string'],
            'description_ar' => ['nullable', 'string'],
            'status' => ['required', Rule::in([
                KnowledgeBaseCategory::STATUS_ACTIVE,
                KnowledgeBaseCategory::STATUS_INACTIVE,
            ])],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
