<?php

namespace App\Services\Billing;

use App\Models\Tenant;
use App\Services\Tenancy\TenantSettingService;

class PaymentGatewaySettingsService
{
    public function __construct(
        private readonly TenantSettingService $settings,
    ) {
    }

    public function forTenant(Tenant $tenant): array
    {
        $offlineEnabled = $this->settings->get($tenant, 'payments.offline.enabled');
        $offlineInstructions = $this->settings->get($tenant, 'payments.offline.instructions');

        return [
            'stripe' => [
                'enabled' => (bool) $this->settings->get($tenant, 'payments.stripe.enabled', false),
                'publishable_key' => (string) ($this->settings->get($tenant, 'payments.stripe.publishable_key', '') ?? ''),
                'secret_key' => (string) ($this->settings->get($tenant, 'payments.stripe.secret_key', '') ?? ''),
                'webhook_secret' => (string) ($this->settings->get($tenant, 'payments.stripe.webhook_secret', '') ?? ''),
            ],
            'paypal' => [
                'enabled' => (bool) $this->settings->get($tenant, 'payments.paypal.enabled', false),
                'client_id' => (string) ($this->settings->get($tenant, 'payments.paypal.client_id', '') ?? ''),
                'client_secret' => (string) ($this->settings->get($tenant, 'payments.paypal.client_secret', '') ?? ''),
                'webhook_id' => (string) ($this->settings->get($tenant, 'payments.paypal.webhook_id', '') ?? ''),
                'mode' => (string) ($this->settings->get($tenant, 'payments.paypal.mode', 'sandbox') ?? 'sandbox'),
            ],
            'offline' => [
                'enabled' => (bool) ($offlineEnabled ?? $this->settings->get($tenant, 'payments.manual.enabled', true)),
                'instructions' => (string) (($offlineInstructions ?? $this->settings->get($tenant, 'payments.manual.instructions', '')) ?? ''),
            ],
        ];
    }

    public function update(Tenant $tenant, array $payload): array
    {
        $this->settings->put($tenant, 'payments.stripe.enabled', (bool) $payload['stripe']['enabled']);
        $this->settings->put($tenant, 'payments.stripe.publishable_key', (string) ($payload['stripe']['publishable_key'] ?? ''), true);
        $this->settings->put($tenant, 'payments.stripe.secret_key', (string) ($payload['stripe']['secret_key'] ?? ''), true);
        $this->settings->put($tenant, 'payments.stripe.webhook_secret', (string) ($payload['stripe']['webhook_secret'] ?? ''), true);

        $this->settings->put($tenant, 'payments.paypal.enabled', (bool) $payload['paypal']['enabled']);
        $this->settings->put($tenant, 'payments.paypal.client_id', (string) ($payload['paypal']['client_id'] ?? ''), true);
        $this->settings->put($tenant, 'payments.paypal.client_secret', (string) ($payload['paypal']['client_secret'] ?? ''), true);
        $this->settings->put($tenant, 'payments.paypal.webhook_id', (string) ($payload['paypal']['webhook_id'] ?? ''), true);
        $this->settings->put($tenant, 'payments.paypal.mode', (string) ($payload['paypal']['mode'] ?? 'sandbox'));

        $this->settings->put($tenant, 'payments.offline.enabled', (bool) $payload['offline']['enabled']);
        $this->settings->put($tenant, 'payments.offline.instructions', (string) ($payload['offline']['instructions'] ?? ''));

        return $this->forTenant($tenant);
    }
}
