<?php

namespace App\Services\Tenancy;

use App\Models\Tenant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TenantBrandingService
{
    private const KEY_LOGO_PATH = 'branding.logo_path';
    private const KEY_FAVICON_PATH = 'branding.favicon_path';
    private const KEY_PORTAL_NAME = 'branding.portal_name';
    private const KEY_PORTAL_TAGLINE = 'branding.portal_tagline';

    public function __construct(
        private readonly TenantSettingService $settings,
    ) {
    }

    public function get(Tenant $tenant): array
    {
        $values = $this->settings->getMany($tenant, [
            self::KEY_LOGO_PATH,
            self::KEY_FAVICON_PATH,
            self::KEY_PORTAL_NAME,
            self::KEY_PORTAL_TAGLINE,
        ]);

        $logoPath = is_string($values[self::KEY_LOGO_PATH] ?? null) ? $values[self::KEY_LOGO_PATH] : null;
        $faviconPath = is_string($values[self::KEY_FAVICON_PATH] ?? null) ? $values[self::KEY_FAVICON_PATH] : null;

        return [
            'company_name' => $tenant->name,
            'default_currency' => $tenant->default_currency,
            'default_locale' => $tenant->default_locale,
            'timezone' => $tenant->timezone,
            'portal_name' => (string) ($values[self::KEY_PORTAL_NAME] ?? $tenant->name),
            'portal_tagline' => (string) ($values[self::KEY_PORTAL_TAGLINE] ?? ''),
            'logo_path' => $logoPath,
            'logo_url' => $this->publicAssetUrl($logoPath),
            'favicon_path' => $faviconPath,
            'favicon_url' => $this->publicAssetUrl($faviconPath),
        ];
    }

    public function update(Tenant $tenant, array $payload): array
    {
        $tenant->fill([
            'name' => trim((string) $payload['company_name']),
            'default_currency' => Str::upper(trim((string) $payload['default_currency'])),
            'default_locale' => trim((string) $payload['default_locale']),
            'timezone' => trim((string) $payload['timezone']),
        ]);
        $tenant->save();

        $this->settings->put($tenant, self::KEY_PORTAL_NAME, trim((string) $payload['portal_name']));
        $this->settings->put($tenant, self::KEY_PORTAL_TAGLINE, trim((string) ($payload['portal_tagline'] ?? '')));

        if (($payload['remove_logo'] ?? false) === true) {
            $this->deleteStoredAsset((string) $this->settings->get($tenant, self::KEY_LOGO_PATH, ''));
            $this->settings->put($tenant, self::KEY_LOGO_PATH, null);
        }

        if (($payload['remove_favicon'] ?? false) === true) {
            $this->deleteStoredAsset((string) $this->settings->get($tenant, self::KEY_FAVICON_PATH, ''));
            $this->settings->put($tenant, self::KEY_FAVICON_PATH, null);
        }

        if (($payload['logo'] ?? null) instanceof UploadedFile) {
            $this->replaceAsset($tenant, self::KEY_LOGO_PATH, $payload['logo'], 'logos');
        }

        if (($payload['favicon'] ?? null) instanceof UploadedFile) {
            $this->replaceAsset($tenant, self::KEY_FAVICON_PATH, $payload['favicon'], 'favicons');
        }

        return $this->get($tenant->fresh());
    }

    public function publicAssetUrl(?string $path): ?string
    {
        if (! filled($path)) {
            return null;
        }

        $relativeUrl = Storage::disk('public')->url($path);

        if (str_starts_with($relativeUrl, 'http://') || str_starts_with($relativeUrl, 'https://')) {
            return $relativeUrl;
        }

        return rtrim((string) config('app.url'), '/').$relativeUrl;
    }

    private function replaceAsset(Tenant $tenant, string $key, UploadedFile $file, string $directory): void
    {
        $existingPath = (string) $this->settings->get($tenant, $key, '');

        if (filled($existingPath)) {
            $this->deleteStoredAsset($existingPath);
        }

        $storedPath = $file->store("tenant-branding/{$tenant->id}/{$directory}", 'public');

        $this->settings->put($tenant, $key, $storedPath);
    }

    private function deleteStoredAsset(string $path): void
    {
        if (filled($path) && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
