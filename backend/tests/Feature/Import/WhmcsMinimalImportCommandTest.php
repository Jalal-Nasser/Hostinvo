<?php

namespace Tests\Feature\Import;

use App\Models\Client;
use App\Models\ClientAddress;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\ProductPricing;
use App\Models\Role;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class WhmcsMinimalImportCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_imports_minimal_whmcs_business_data_for_one_tenant(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'WHMCS Import Tenant',
            'slug' => 'whmcs-import-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $this->createWhmcsSourceTables();
        $this->seedWhmcsSourceRows();

        $this->artisan('whmcs:import-minimal', [
            '--tenant' => $tenant->id,
            '--connection' => config('database.default'),
        ])
            ->expectsOutputToContain('WHMCS minimal import completed')
            ->assertExitCode(0);

        $client = Client::query()
            ->where('tenant_id', $tenant->id)
            ->where('email', 'jane@example.test')
            ->firstOrFail();

        $this->assertSame('Jane', $client->first_name);
        $this->assertSame('Doe', $client->last_name);
        $this->assertSame('Example LLC', $client->company_name);

        $portalUser = User::query()
            ->where('tenant_id', $tenant->id)
            ->where('email', 'jane@example.test')
            ->firstOrFail();

        $this->assertNull($portalUser->password);
        $this->assertTrue($portalUser->requires_password_reset);
        $this->assertTrue($portalUser->roles()->where('name', Role::CLIENT_USER)->exists());
        $this->assertSame($portalUser->id, $client->user_id);

        $this->assertDatabaseHas('tenant_users', [
            'tenant_id' => $tenant->id,
            'user_id' => $portalUser->id,
        ]);

        $this->assertDatabaseHas('client_addresses', [
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'type' => ClientAddress::TYPE_BILLING,
            'line_1' => '1 Hosting Street',
            'city' => 'New York',
            'country' => 'US',
        ]);

        $group = ProductGroup::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'whmcs-group-3-shared-hosting')
            ->firstOrFail();

        $product = Product::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'whmcs-product-7-basic-plan')
            ->firstOrFail();

        $this->assertSame($group->id, $product->product_group_id);
        $this->assertSame('Plesk starter hosting.', $product->description);

        $this->assertDatabaseHas('product_pricing', [
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'price' => 0,
            'setup_fee' => 0,
            'is_enabled' => true,
        ]);

        $service = Service::query()
            ->where('tenant_id', $tenant->id)
            ->where('external_reference', 'whmcs-hosting:20')
            ->firstOrFail();

        $this->assertSame($client->id, $service->client_id);
        $this->assertSame($product->id, $service->product_id);
        $this->assertSame(Service::STATUS_ACTIVE, $service->status);
        $this->assertSame(Service::PROVISIONING_SYNCED, $service->provisioning_state);
        $this->assertSame(ProductPricing::CYCLE_ANNUALLY, $service->billing_cycle);
        $this->assertSame('example.test', $service->domain);
        $this->assertSame('janeuser', $service->username);
        $this->assertSame('2026-05-15', $service->next_due_date?->toDateString());

        $placeholder = Product::query()
            ->where('tenant_id', $tenant->id)
            ->where('name', 'Migrated Product #99')
            ->firstOrFail();

        $this->assertDatabaseHas('services', [
            'tenant_id' => $tenant->id,
            'product_id' => $placeholder->id,
            'external_reference' => 'whmcs-hosting:21',
            'status' => Service::STATUS_SUSPENDED,
        ]);

        $secondExitCode = Artisan::call('whmcs:import-minimal', [
            '--tenant' => $tenant->slug,
            '--connection' => config('database.default'),
        ]);

        $this->assertSame(0, $secondExitCode, Artisan::output());

        $this->assertSame(1, Client::query()->where('tenant_id', $tenant->id)->count());
        $this->assertSame(2, Service::query()->where('tenant_id', $tenant->id)->count());
    }

    private function createWhmcsSourceTables(): void
    {
        Schema::create('tblclients', function (Blueprint $table): void {
            $table->integer('id')->primary();
            $table->string('email')->nullable();
            $table->string('firstname')->nullable();
            $table->string('lastname')->nullable();
            $table->string('companyname')->nullable();
            $table->string('phonenumber')->nullable();
            $table->string('address1')->nullable();
            $table->string('address2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postcode')->nullable();
            $table->string('country', 2)->nullable();
        });

        Schema::create('tblproductgroups', function (Blueprint $table): void {
            $table->integer('id')->primary();
            $table->string('name')->nullable();
            $table->string('headline')->nullable();
            $table->integer('order')->default(0);
        });

        Schema::create('tblproducts', function (Blueprint $table): void {
            $table->integer('id')->primary();
            $table->integer('gid')->nullable();
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->string('servertype')->nullable();
            $table->string('configoption1')->nullable();
            $table->string('hidden')->nullable();
            $table->integer('order')->default(0);
        });

        Schema::create('tblhosting', function (Blueprint $table): void {
            $table->integer('id')->primary();
            $table->integer('userid')->nullable();
            $table->integer('packageid')->nullable();
            $table->string('domain')->nullable();
            $table->string('username')->nullable();
            $table->string('billingcycle')->nullable();
            $table->date('regdate')->nullable();
            $table->date('nextduedate')->nullable();
            $table->string('domainstatus')->nullable();
            $table->text('notes')->nullable();
        });
    }

    private function seedWhmcsSourceRows(): void
    {
        DB::table('tblclients')->insert([
            'id' => 100,
            'email' => 'jane@example.test',
            'firstname' => 'Jane',
            'lastname' => 'Doe',
            'companyname' => 'Example LLC',
            'phonenumber' => '+15550100',
            'address1' => '1 Hosting Street',
            'address2' => 'Suite 8',
            'city' => 'New York',
            'state' => 'NY',
            'postcode' => '10001',
            'country' => 'US',
        ]);

        DB::table('tblproductgroups')->insert([
            'id' => 3,
            'name' => 'Shared Hosting',
            'headline' => 'Hosting packages',
            'order' => 1,
        ]);

        DB::table('tblproducts')->insert([
            'id' => 7,
            'gid' => 3,
            'name' => 'Basic Plan',
            'description' => 'Plesk starter hosting.',
            'servertype' => 'plesk',
            'configoption1' => 'Basic Plan',
            'hidden' => '',
            'order' => 1,
        ]);

        DB::table('tblhosting')->insert([
            [
                'id' => 20,
                'userid' => 100,
                'packageid' => 7,
                'domain' => 'example.test',
                'username' => 'janeuser',
                'billingcycle' => 'Annually',
                'regdate' => '2025-05-15',
                'nextduedate' => '2026-05-15',
                'domainstatus' => 'Active',
                'notes' => null,
            ],
            [
                'id' => 21,
                'userid' => 100,
                'packageid' => 99,
                'domain' => 'missing-product.test',
                'username' => 'missingp',
                'billingcycle' => 'Monthly',
                'regdate' => '2025-06-01',
                'nextduedate' => '2026-06-01',
                'domainstatus' => 'Suspended',
                'notes' => null,
            ],
        ]);
    }
}
