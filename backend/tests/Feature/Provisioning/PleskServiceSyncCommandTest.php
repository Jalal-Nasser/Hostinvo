<?php

namespace Tests\Feature\Provisioning;

use App\Models\Client;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\Server;
use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PleskServiceSyncCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_links_imported_whmcs_services_to_existing_plesk_subscriptions(): void
    {
        [$tenant, $server, $product, $client] = $this->createSyncContext();

        $domainMatched = $this->createService($tenant, $product, $client, [
            'server_id' => null,
            'reference_number' => 'SVC-WHMCS-20',
            'status' => Service::STATUS_PENDING,
            'domain' => 'Example.test',
            'username' => 'domainuser',
            'external_reference' => 'whmcs-hosting:20',
        ]);

        $usernameMatched = $this->createService($tenant, $product, $client, [
            'server_id' => null,
            'reference_number' => 'SVC-WHMCS-21',
            'status' => Service::STATUS_PENDING,
            'domain' => 'not-on-plesk.example.test',
            'username' => 'UserMatch',
            'external_reference' => 'whmcs-hosting:21',
        ]);

        $unmatched = $this->createService($tenant, $product, $client, [
            'server_id' => null,
            'reference_number' => 'SVC-WHMCS-22',
            'status' => Service::STATUS_PENDING,
            'domain' => 'missing.example.test',
            'username' => 'missinguser',
            'external_reference' => 'whmcs-hosting:22',
        ]);

        $nonWhmcs = $this->createService($tenant, $product, $client, [
            'server_id' => null,
            'reference_number' => 'SVC-PLESK-OLD',
            'status' => Service::STATUS_PENDING,
            'domain' => 'example.test',
            'username' => 'domainuser',
            'external_reference' => 'manual-import',
        ]);

        Http::fake([
            'https://192.0.2.70:8443/api/v2/subscriptions' => Http::response([
                [
                    'id' => 501,
                    'name' => 'example.test',
                    'login' => 'differentuser',
                    'status' => 'active',
                ],
                [
                    'id' => 'sub-502',
                    'domain' => 'other.example.test',
                    'login' => 'usermatch',
                    'status' => 'suspended',
                ],
            ], 200),
        ]);

        $this->artisan('plesk:sync-services', [
            '--server' => $server->id,
        ])
            ->expectsOutputToContain('Plesk service sync completed')
            ->assertExitCode(0);

        Http::assertSentCount(1);
        Http::assertSent(function (Request $request): bool {
            return $request->method() === 'GET'
                && $request->url() === 'https://192.0.2.70:8443/api/v2/subscriptions'
                && $request->hasHeader('Authorization', 'Basic '.base64_encode('admin:plesk-sync-key'));
        });
        Http::assertNotSent(fn (Request $request): bool => $request->method() !== 'GET');

        $this->assertDatabaseHas('services', [
            'id' => $domainMatched->id,
            'server_id' => $server->id,
            'external_reference' => 'whmcs-hosting:20',
            'external_id' => '501',
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'last_operation' => 'plesk_sync_services',
        ]);

        $this->assertDatabaseHas('services', [
            'id' => $usernameMatched->id,
            'server_id' => $server->id,
            'external_reference' => 'whmcs-hosting:21',
            'external_id' => 'sub-502',
            'status' => Service::STATUS_PENDING,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'last_operation' => 'plesk_sync_services',
        ]);

        $this->assertDatabaseHas('services', [
            'id' => $unmatched->id,
            'server_id' => null,
            'external_id' => null,
            'status' => Service::STATUS_PENDING,
        ]);

        $this->assertDatabaseHas('services', [
            'id' => $nonWhmcs->id,
            'server_id' => null,
            'external_id' => null,
            'status' => Service::STATUS_PENDING,
        ]);
    }

    /**
     * @return array{0: Tenant, 1: Server, 2: Product, 3: Client}
     */
    private function createSyncContext(): array
    {
        $tenant = Tenant::query()->create([
            'name' => 'Plesk Sync Tenant',
            'slug' => 'plesk-sync-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Sync Client',
            'email' => 'sync-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'WHMCS Plesk Hosting',
            'slug' => 'whmcs-plesk-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
            'provisioning_module' => Product::MODULE_PLESK,
        ]);

        $server = Server::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Sync Plesk Node',
            'hostname' => '192.0.2.70',
            'panel_type' => Server::PANEL_PLESK,
            'api_endpoint' => 'https://192.0.2.70:8443',
            'api_port' => 8443,
            'status' => Server::STATUS_ACTIVE,
            'verify_ssl' => true,
            'max_accounts' => 200,
            'current_accounts' => 0,
            'username' => 'admin',
            'credentials' => [
                'api_key' => 'plesk-sync-key',
            ],
        ]);

        return [$tenant, $server, $product, $client];
    }

    private function createService(Tenant $tenant, Product $product, Client $client, array $attributes): Service
    {
        return Service::query()->forceCreate(array_merge([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'service_type' => Service::TYPE_HOSTING,
            'provisioning_state' => Service::PROVISIONING_IDLE,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'price' => 0,
            'currency' => 'USD',
        ], $attributes));
    }
}
