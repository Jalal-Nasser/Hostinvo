<?php

namespace App\Http\Requests\Payments;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;

class CapturePayPalCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && (
                $user->can('create', Payment::class)
                || $user->hasPermissionTo('client.portal.access')
            );
    }

    public function rules(): array
    {
        return [
            'order_id' => ['required', 'string', 'max:191'],
            'payer_id' => ['nullable', 'string', 'max:191'],
        ];
    }
}
