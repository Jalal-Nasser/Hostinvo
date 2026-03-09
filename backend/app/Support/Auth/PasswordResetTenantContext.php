<?php

namespace App\Support\Auth;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetTenantContext
{
    public function __construct(
        private readonly TenantRepositoryInterface $tenants,
    ) {}

    public function buildSignedUrlContext(User $user, string $token): array
    {
        if (blank($user->tenant_id)) {
            return [];
        }

        return [
            'tenant_id' => $user->tenant_id,
            'tenant_signature' => $this->signatureFor($user->tenant_id, $user->email, $token),
        ];
    }

    public function resolveTenantIdFromRequest(Request $request, array $payload = []): ?string
    {
        $tenantId = $this->resolveSignedTenantId($request, $payload);

        if ($tenantId) {
            return $tenantId;
        }

        return $this->resolveTenantFromHostHints($request)?->getKey();
    }

    private function resolveSignedTenantId(Request $request, array $payload): ?string
    {
        $tenantId = Arr::get($payload, 'tenant_id', $request->input('tenant_id'));
        $signature = Arr::get($payload, 'tenant_signature', $request->input('tenant_signature'));
        $token = Arr::get($payload, 'token', $request->input('token'));
        $email = Arr::get($payload, 'email', $request->input('email'));

        if (blank($tenantId) && blank($signature)) {
            return null;
        }

        if (blank($tenantId) || blank($signature) || blank($token) || blank($email)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.password_reset_invalid_context')],
            ]);
        }

        $tenant = $this->tenants->findById((string) $tenantId);

        if (! $tenant) {
            throw ValidationException::withMessages([
                'email' => [__('auth.password_reset_invalid_context')],
            ]);
        }

        if (! hash_equals($this->signatureFor($tenant->id, (string) $email, (string) $token), (string) $signature)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.password_reset_invalid_context')],
            ]);
        }

        return $tenant->id;
    }

    private function resolveTenantFromHostHints(Request $request): ?Tenant
    {
        $hosts = array_filter([
            $request->headers->get('X-Tenant-Host'),
            parse_url((string) $request->headers->get('Origin'), PHP_URL_HOST),
            parse_url((string) $request->headers->get('Referer'), PHP_URL_HOST),
            $request->getHost(),
        ]);

        foreach ($hosts as $host) {
            $normalized = Str::lower(trim((string) $host));

            if ($normalized === '') {
                continue;
            }

            $tenant = $this->tenants->findByHost($normalized);

            if ($tenant) {
                return $tenant;
            }
        }

        return null;
    }

    private function signatureFor(string $tenantId, string $email, string $token): string
    {
        return hash_hmac(
            'sha256',
            implode('|', [
                Str::lower(trim($tenantId)),
                Str::lower(trim($email)),
                trim($token),
            ]),
            (string) config('app.key'),
        );
    }
}
