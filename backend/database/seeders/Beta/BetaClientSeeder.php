<?php

namespace Database\Seeders\Beta;

use App\Models\Client;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class BetaClientSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::query()
            ->where('slug', 'like', 'beta-%')
            ->get();

        foreach ($tenants as $tenant) {
            $clients = [
                [
                    'client_type' => Client::TYPE_COMPANY,
                    'company_name' => 'Acme Demo Ltd',
                    'email' => sprintf('acme+%s@hostinvo.test', $tenant->slug),
                    'country' => 'US',
                    'preferred_locale' => $tenant->default_locale,
                ],
                [
                    'client_type' => Client::TYPE_INDIVIDUAL,
                    'first_name' => 'Layla',
                    'last_name' => 'Beta',
                    'email' => sprintf('layla+%s@hostinvo.test', $tenant->slug),
                    'country' => 'SA',
                    'preferred_locale' => $tenant->default_locale,
                ],
            ];

            foreach ($clients as $payload) {
                $client = Client::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('email', $payload['email'])
                    ->first() ?? new Client();

                $client->forceFill([
                    'tenant_id' => $tenant->id,
                    'client_type' => $payload['client_type'],
                    'first_name' => $payload['first_name'] ?? null,
                    'last_name' => $payload['last_name'] ?? null,
                    'company_name' => $payload['company_name'] ?? null,
                    'email' => $payload['email'],
                    'country' => $payload['country'],
                    'status' => Client::STATUS_ACTIVE,
                    'preferred_locale' => $payload['preferred_locale'],
                    'currency' => 'USD',
                    'notes' => 'Seeded beta fixture client.',
                ]);
                $client->save();
            }
        }
    }
}

