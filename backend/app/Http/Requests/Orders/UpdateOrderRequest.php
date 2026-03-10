<?php

namespace App\Http\Requests\Orders;

use App\Http\Requests\Concerns\SanitizesInputContent;
use App\Http\Requests\Orders\Concerns\HasOrderPayloadRules;
use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    use HasOrderPayloadRules;
    use SanitizesInputContent;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $order = $this->route('order');

        return $order instanceof Order && $this->user()->can('update', $order);
    }

    protected function prepareForValidation(): void
    {
        $this->sanitizePlainTextFields(['notes']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->orderPayloadRules(true);
    }
}
