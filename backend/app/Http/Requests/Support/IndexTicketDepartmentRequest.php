<?php

namespace App\Http\Requests\Support;

use App\Models\TicketDepartment;
use Illuminate\Foundation\Http\FormRequest;

class IndexTicketDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', TicketDepartment::class);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
