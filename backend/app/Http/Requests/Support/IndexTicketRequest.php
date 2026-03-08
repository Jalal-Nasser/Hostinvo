<?php

namespace App\Http\Requests\Support;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Ticket::class);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status_id' => ['nullable', 'integer'],
            'priority' => ['nullable', Rule::in(Ticket::priorities())],
            'department_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
