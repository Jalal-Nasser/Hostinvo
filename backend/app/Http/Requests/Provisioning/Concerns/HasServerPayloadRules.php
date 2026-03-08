<?php

namespace App\Http\Requests\Provisioning\Concerns;

use App\Models\Server;
use Illuminate\Validation\Rule;

trait HasServerPayloadRules
{
    public function serverPayloadRules(): array
    {
        $existingServer = $this->route('server');
        $requiresCpanelUsername = fn () => $this->input('panel_type') === Server::PANEL_CPANEL
            && ($this->isMethod('post') || blank($existingServer?->username));
        $requiresCpanelToken = fn () => $this->input('panel_type') === Server::PANEL_CPANEL
            && ($this->isMethod('post') || blank($existingServer?->credentials['api_token'] ?? null));

        return [
            'server_group_id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'hostname' => ['required', 'string', 'max:255'],
            'panel_type' => ['required', 'string', Rule::in(Server::panelTypes())],
            'api_endpoint' => ['required', 'string', 'max:255'],
            'api_port' => ['nullable', 'integer', 'between:1,65535'],
            'status' => ['required', 'string', Rule::in(Server::statuses())],
            'verify_ssl' => ['nullable', 'boolean'],
            'max_accounts' => ['nullable', 'integer', 'min:0'],
            'current_accounts' => ['nullable', 'integer', 'min:0'],
            'username' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf($requiresCpanelUsername),
            ],
            'credentials' => ['nullable', 'array'],
            'credentials.api_token' => [
                'nullable',
                'string',
                'max:2048',
                Rule::requiredIf($requiresCpanelToken),
            ],
            'credentials.api_key' => ['nullable', 'string', 'max:2048'],
            'credentials.api_secret' => ['nullable', 'string', 'max:2048'],
            'credentials.notes' => ['nullable', 'string'],
            'last_tested_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'packages' => ['nullable', 'array'],
            'packages.*.id' => ['nullable', 'uuid'],
            'packages.*.product_id' => ['required', 'uuid'],
            'packages.*.panel_package_name' => ['required', 'string', 'max:255'],
            'packages.*.display_name' => ['nullable', 'string', 'max:255'],
            'packages.*.is_default' => ['nullable', 'boolean'],
            'packages.*.metadata' => ['nullable', 'array'],
        ];
    }
}
