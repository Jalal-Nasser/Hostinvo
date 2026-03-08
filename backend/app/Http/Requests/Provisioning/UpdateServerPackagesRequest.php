<?php

namespace App\Http\Requests\Provisioning;

use App\Http\Requests\Provisioning\Concerns\HasServerPayloadRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServerPackagesRequest extends FormRequest
{
    use HasServerPayloadRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('server'));
    }

    public function rules(): array
    {
        return [
            'packages' => $this->serverPayloadRules()['packages'],
            'packages.*.id' => $this->serverPayloadRules()['packages.*.id'],
            'packages.*.product_id' => $this->serverPayloadRules()['packages.*.product_id'],
            'packages.*.panel_package_name' => $this->serverPayloadRules()['packages.*.panel_package_name'],
            'packages.*.display_name' => $this->serverPayloadRules()['packages.*.display_name'],
            'packages.*.is_default' => $this->serverPayloadRules()['packages.*.is_default'],
            'packages.*.metadata' => $this->serverPayloadRules()['packages.*.metadata'],
        ];
    }
}
