<?php

namespace App\Payments;

use App\Models\Tenant;
use App\Payments\Contracts\PaymentGatewayInterface;
use App\Payments\DataTransferObjects\GatewayConfiguration;
use App\Payments\Exceptions\PaymentGatewayException;
use App\Services\Tenancy\TenantSettingService;

class PaymentGatewayManager
{
    public function __construct(
        private readonly TenantSettingService $settings,
    ) {
    }

    public function resolve(string $gateway): PaymentGatewayInterface
    {
        $driverClass = config("payments.gateways.{$gateway}.driver");

        if (! is_string($driverClass) || $driverClass === '') {
            throw new PaymentGatewayException('The requested payment gateway is not configured.');
        }

        $driver = app($driverClass);

        if (! $driver instanceof PaymentGatewayInterface) {
            throw new PaymentGatewayException('The configured payment gateway driver is invalid.');
        }

        return $driver;
    }

    public function supports(string $gateway): bool
    {
        return is_array(config("payments.gateways.{$gateway}"));
    }

    public function supportedGatewayCodes(): array
    {
        return array_keys((array) config('payments.gateways', []));
    }

    public function configurationForTenant(Tenant $tenant, string $gateway): GatewayConfiguration
    {
        $config = config("payments.gateways.{$gateway}");

        if (! is_array($config)) {
            throw new PaymentGatewayException('The requested payment gateway is not configured.');
        }

        $settingMap = $config['settings'] ?? [];
        $resolved = $this->settings->getMany($tenant, array_values($settingMap));
        $credentials = [];

        foreach ($settingMap as $field => $settingKey) {
            $value = $resolved[$settingKey] ?? $config[$field] ?? null;

            if ($field === 'enabled') {
                continue;
            }

            $credentials[$field] = $value;
        }

        $enabled = (bool) ($resolved[$settingMap['enabled'] ?? ''] ?? $config['enabled'] ?? false);
        $options = $config;
        unset($options['driver'], $options['settings'], $options['required'], $options['label'], $options['description'], $options['enabled']);

        return new GatewayConfiguration(
            code: $gateway,
            label: (string) ($config['label'] ?? str($gateway)->title()->toString()),
            description: (string) ($config['description'] ?? ''),
            enabled: $enabled,
            credentials: $credentials,
            options: $options,
            required: is_array($config['required'] ?? null) ? $config['required'] : [],
        );
    }

    public function availableForTenant(Tenant $tenant): array
    {
        $gateways = [];

        foreach (array_keys(config('payments.gateways', [])) as $gateway) {
            $configuration = $this->configurationForTenant($tenant, $gateway);

            if ($configuration->usable()) {
                $gateways[] = $configuration;
            }
        }

        return $gateways;
    }
}
