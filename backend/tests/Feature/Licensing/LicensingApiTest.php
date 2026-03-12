<?php

namespace Tests\Feature\Licensing;

use App\Models\License;
use App\Models\LicenseActivation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LicensingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_license_validation_returns_plan_and_limit_data(): void
    {
        $license = License::query()->create([
            'license_key' => 'HOST-STARTER-001',
            'owner_email' => 'owner@example.test',
            'plan' => License::PLAN_STARTER,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 250,
            'max_services' => 5,
            'activation_limit' => 1,
            'issued_at' => now(),
            'expires_at' => now()->addMonths(6),
        ]);

        $response = $this->postJson('/api/v1/licensing/validate', [
            'license_key' => $license->license_key,
            'domain' => 'provider.example.test',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.license.plan', License::PLAN_STARTER)
            ->assertJsonPath('data.license.max_clients', 250)
            ->assertJsonPath('data.license.max_services', 5)
            ->assertJsonPath('data.license.remaining_activations', 1);
    }

    public function test_license_activation_enforces_domain_binding_and_activation_limit(): void
    {
        $license = License::query()->create([
            'license_key' => 'HOST-PRO-001',
            'owner_email' => 'owner@example.test',
            'plan' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 1000,
            'max_services' => 20,
            'activation_limit' => 1,
            'issued_at' => now(),
            'expires_at' => now()->addYear(),
        ]);

        $this->postJson('/api/v1/licensing/activate', [
            'license_key' => $license->license_key,
            'domain' => 'provider.example.test',
            'instance_id' => 'instance-a',
        ])->assertOk()
            ->assertJsonPath('data.activation.status', LicenseActivation::STATUS_ACTIVE);

        $this->assertDatabaseHas('license_activations', [
            'license_id' => $license->id,
            'domain' => 'provider.example.test',
            'instance_id' => 'instance-a',
            'status' => LicenseActivation::STATUS_ACTIVE,
        ]);

        $this->postJson('/api/v1/licensing/activate', [
            'license_key' => $license->license_key,
            'domain' => 'provider.example.test',
            'instance_id' => 'instance-b',
        ])->assertStatus(422);

        $this->postJson('/api/v1/licensing/validate', [
            'license_key' => $license->license_key,
            'domain' => 'other.example.test',
        ])->assertOk()
            ->assertJsonPath('data.valid', false)
            ->assertJsonPath('data.license.bound_domain', 'provider.example.test');
    }
}
