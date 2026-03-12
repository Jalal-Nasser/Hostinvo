<?php

namespace Database\Seeders\Beta;

use App\Models\Client;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\Server;
use App\Models\ServerGroup;
use App\Models\ServerPackage;
use App\Models\Service;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class BetaProvisioningSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::query()
            ->where('slug', 'like', 'beta-%')
            ->get();

        foreach ($tenants as $index => $tenant) {
            $client = Client::query()
                ->where('tenant_id', $tenant->id)
                ->orderBy('created_at')
                ->first();

            $product = Product::query()
                ->where('tenant_id', $tenant->id)
                ->where('type', Product::TYPE_HOSTING)
                ->orderBy('created_at')
                ->first();

            $owner = User::query()
                ->where('tenant_id', $tenant->id)
                ->orderBy('created_at')
                ->first();

            if (! $client || ! $product || ! $owner) {
                continue;
            }

            $group = ServerGroup::query()
                ->where('tenant_id', $tenant->id)
                ->where('name', 'Beta Provisioning Group')
                ->first() ?? new ServerGroup();

            $group->forceFill([
                'tenant_id' => $tenant->id,
                'name' => 'Beta Provisioning Group',
                'selection_strategy' => ServerGroup::STRATEGY_LEAST_ACCOUNTS,
                'fill_type' => ServerGroup::STRATEGY_LEAST_ACCOUNTS,
                'status' => ServerGroup::STATUS_ACTIVE,
                'notes' => 'Seeded server group for beta provisioning validation.',
            ]);
            $group->save();

            $hostname = sprintf('%s-node.beta.hostinvo.test', $tenant->slug);

            $server = Server::query()
                ->where('tenant_id', $tenant->id)
                ->where('hostname', $hostname)
                ->first() ?? new Server();

            $server->forceFill([
                'tenant_id' => $tenant->id,
                'server_group_id' => $group->id,
                'name' => sprintf('%s Beta Node', $tenant->name),
                'hostname' => $hostname,
                'panel_type' => Server::PANEL_CPANEL,
                'api_endpoint' => sprintf('https://%s:2087', $hostname),
                'api_port' => 2087,
                'status' => Server::STATUS_ACTIVE,
                'ssl_verify' => true,
                'max_accounts' => 250,
                'account_count' => 0,
                'username' => 'root',
                'ip_address' => sprintf('10.20.0.%d', $index + 10),
                'notes' => 'Seeded beta server fixture (non-production credentials).',
            ]);
            $server->credentials = [
                'username' => 'root',
                'api_token' => sprintf('beta-token-%s', $tenant->slug),
            ];
            $server->save();

            $serverPackage = ServerPackage::query()
                ->where('tenant_id', $tenant->id)
                ->where('server_id', $server->id)
                ->where('product_id', $product->id)
                ->first() ?? new ServerPackage();

            $serverPackage->forceFill([
                'tenant_id' => $tenant->id,
                'server_id' => $server->id,
                'product_id' => $product->id,
                'panel_package_name' => sprintf('%s_shared', str_replace('-', '_', $tenant->slug)),
                'display_name' => sprintf('%s Shared Package', $tenant->name),
                'is_default' => true,
                'metadata' => ['seed' => 'beta_fixture'],
            ]);
            $serverPackage->save();

            $serviceReference = sprintf('BETA-SVC-%s', strtoupper(str_replace('-', '', $tenant->slug)));
            $service = Service::query()
                ->where('tenant_id', $tenant->id)
                ->where('reference_number', $serviceReference)
                ->first() ?? new Service();

            $service->forceFill([
                'tenant_id' => $tenant->id,
                'client_id' => $client->id,
                'product_id' => $product->id,
                'user_id' => $owner->id,
                'server_id' => $server->id,
                'server_package_id' => $serverPackage->id,
                'reference_number' => $serviceReference,
                'service_type' => Service::TYPE_HOSTING,
                'status' => Service::STATUS_ACTIVE,
                'provisioning_state' => Service::PROVISIONING_SYNCED,
                'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                'price' => 999,
                'currency' => 'USD',
                'domain' => sprintf('%s-client.beta.hostinvo.test', $tenant->slug),
                'username' => sprintf('%suser', str_replace('-', '', $tenant->slug)),
                'external_reference' => sprintf('ext-%s', $tenant->slug),
                'activated_at' => now()->subDays(14),
                'next_due_date' => now()->addMonthNoOverflow()->toDateString(),
                'last_synced_at' => now(),
                'notes' => 'Seeded service used for beta provisioning simulations.',
                'metadata' => ['seed' => 'beta_fixture'],
            ]);
            $service->save();

            $subscription = Subscription::query()
                ->where('tenant_id', $tenant->id)
                ->where('service_id', $service->id)
                ->first() ?? new Subscription();

            $subscription->forceFill([
                'tenant_id' => $tenant->id,
                'client_id' => $client->id,
                'service_id' => $service->id,
                'product_id' => $product->id,
                'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                'price' => 999,
                'currency' => 'USD',
                'status' => 'active',
                'next_billing_date' => now()->addMonthNoOverflow()->toDateString(),
                'last_billed_at' => null,
                'grace_period_days' => 3,
                'auto_renew' => true,
                'cancellation_reason' => null,
                'cancelled_at' => null,
            ]);
            $subscription->save();
        }
    }
}

