<?php

namespace App\Http\Requests\Support;

use App\Models\TicketStatus;
use Illuminate\Foundation\Http\FormRequest;

class IndexTicketStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', TicketStatus::class);
    }

    public function rules(): array
    {
        return [];
    }
}
