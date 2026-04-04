<?php

namespace App\Services\Tenancy;

use App\Models\Tenant;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class PortalSurfaceService
{
    private const KEY_NAVIGATION = 'portal.surface.navigation';
    private const KEY_HOME_SECTIONS = 'portal.surface.home_sections';
    private const KEY_HOME_CARDS = 'portal.surface.home_cards';
    private const KEY_CONTENT_SOURCES = 'portal.surface.content_sources';

    public function __construct(
        private readonly TenantSettingService $settings,
    ) {
    }

    public function get(Tenant $tenant): array
    {
        $values = $this->settings->getMany($tenant, [
            self::KEY_NAVIGATION,
            self::KEY_HOME_SECTIONS,
            self::KEY_HOME_CARDS,
            self::KEY_CONTENT_SOURCES,
        ]);

        return [
            'navigation' => $this->mergeByKey($this->defaultNavigation(), Arr::wrap($values[self::KEY_NAVIGATION] ?? [])),
            'home_sections' => $this->mergeByKey($this->defaultHomeSections(), Arr::wrap($values[self::KEY_HOME_SECTIONS] ?? [])),
            'home_cards' => $this->mergeByKey($this->defaultHomeCards(), Arr::wrap($values[self::KEY_HOME_CARDS] ?? [])),
            'content_sources' => array_replace($this->defaultContentSources(), is_array($values[self::KEY_CONTENT_SOURCES] ?? null) ? $values[self::KEY_CONTENT_SOURCES] : []),
        ];
    }

    public function update(Tenant $tenant, array $payload): array
    {
        $this->settings->put($tenant, self::KEY_NAVIGATION, $this->normalizeEntries($payload['navigation'] ?? [], $this->defaultNavigation()));
        $this->settings->put($tenant, self::KEY_HOME_SECTIONS, $this->normalizeEntries($payload['home_sections'] ?? [], $this->defaultHomeSections()));
        $this->settings->put($tenant, self::KEY_HOME_CARDS, $this->normalizeEntries($payload['home_cards'] ?? [], $this->defaultHomeCards()));
        $this->settings->put($tenant, self::KEY_CONTENT_SOURCES, array_replace($this->defaultContentSources(), $payload['content_sources'] ?? []));

        return $this->get($tenant);
    }

    private function defaultNavigation(): array
    {
        return [
            ['key' => 'products', 'visible' => true, 'order' => 10, 'label_en' => null, 'label_ar' => null],
            ['key' => 'domains', 'visible' => true, 'order' => 20, 'label_en' => null, 'label_ar' => null],
            ['key' => 'website_security', 'visible' => true, 'order' => 30, 'label_en' => null, 'label_ar' => null],
            ['key' => 'support', 'visible' => true, 'order' => 40, 'label_en' => null, 'label_ar' => null],
        ];
    }

    private function defaultHomeSections(): array
    {
        return [
            ['key' => 'domain_hero', 'visible' => true, 'order' => 10, 'label_en' => null, 'label_ar' => null],
            ['key' => 'quick_actions', 'visible' => true, 'order' => 20, 'label_en' => null, 'label_ar' => null],
            ['key' => 'announcements', 'visible' => true, 'order' => 30, 'label_en' => null, 'label_ar' => null],
            ['key' => 'knowledgebase', 'visible' => true, 'order' => 40, 'label_en' => null, 'label_ar' => null],
            ['key' => 'network_status', 'visible' => true, 'order' => 50, 'label_en' => null, 'label_ar' => null],
        ];
    }

    private function defaultHomeCards(): array
    {
        return [
            ['key' => 'register_domain', 'visible' => true, 'order' => 10, 'label_en' => null, 'label_ar' => null],
            ['key' => 'transfer_domain', 'visible' => true, 'order' => 20, 'label_en' => null, 'label_ar' => null],
            ['key' => 'domain_pricing', 'visible' => true, 'order' => 30, 'label_en' => null, 'label_ar' => null],
            ['key' => 'support', 'visible' => true, 'order' => 40, 'label_en' => null, 'label_ar' => null],
        ];
    }

    private function defaultContentSources(): array
    {
        return [
            'announcements' => true,
            'knowledgebase' => true,
            'network_status' => true,
            'website_security' => true,
            'footer_links' => true,
        ];
    }

    private function mergeByKey(array $defaults, array $stored): array
    {
        $storedMap = collect($stored)
            ->filter(fn (mixed $entry): bool => is_array($entry) && filled($entry['key'] ?? null))
            ->keyBy(fn (array $entry): string => (string) $entry['key']);

        return collect($defaults)
            ->map(function (array $default) use ($storedMap): array {
                $storedEntry = $storedMap->get($default['key'], []);

                return array_replace($default, is_array($storedEntry) ? $storedEntry : []);
            })
            ->sortBy('order')
            ->values()
            ->all();
    }

    private function normalizeEntries(array $entries, array $defaults): array
    {
        $allowedKeys = collect($defaults)->pluck('key')->all();

        return collect($entries)
            ->filter(fn (mixed $entry): bool => is_array($entry) && in_array($entry['key'] ?? null, $allowedKeys, true))
            ->map(fn (array $entry): array => [
                'key' => (string) $entry['key'],
                'visible' => (bool) ($entry['visible'] ?? false),
                'order' => (int) ($entry['order'] ?? 0),
                'label_en' => filled($entry['label_en'] ?? null) ? trim((string) $entry['label_en']) : null,
                'label_ar' => filled($entry['label_ar'] ?? null) ? trim((string) $entry['label_ar']) : null,
            ])
            ->sortBy('order')
            ->values()
            ->all();
    }
}
