<?php

namespace App\Http\Requests\Portal;

use App\Models\PortalFooterLink;
use Illuminate\Foundation\Http\FormRequest;

class UpsertPortalFooterLinkRequest extends FormRequest
{
    public function authorize(): bool
    {
        $link = $this->route('portalFooterLink');

        return $link
            ? $this->user()->can('update', $link)
            : $this->user()->can('create', PortalFooterLink::class);
    }

    public function rules(): array
    {
        return [
            'group_key' => ['required', 'string', 'max:100'],
            'label_en' => ['required', 'string', 'max:255'],
            'label_ar' => ['nullable', 'string', 'max:255'],
            'href' => ['required', 'string', 'max:500'],
            'is_visible' => ['nullable', 'boolean'],
            'open_in_new_tab' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
