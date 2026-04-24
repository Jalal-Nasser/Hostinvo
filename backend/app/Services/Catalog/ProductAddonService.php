<?php

namespace App\Services\Catalog;

use App\Models\ProductAddon;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductAddonService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 100);

        return ProductAddon::query()
            ->with(['products', 'pricing'])
            ->withCount('products')
            ->when(
                filled($filters['search'] ?? null),
                fn ($query) => $query->where(function ($builder) use ($filters): void {
                    $search = trim((string) $filters['search']);
                    $builder
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                })
            )
            ->when(
                filled($filters['status'] ?? null),
                fn ($query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['visibility'] ?? null),
                fn ($query) => $query->where('visibility', $filters['visibility'])
            )
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function getForDisplay(ProductAddon $addon): ProductAddon
    {
        return ProductAddon::query()
            ->with(['products', 'pricing'])
            ->withCount('products')
            ->find($addon->getKey()) ?? $addon;
    }

    public function create(array $payload, User $actor): ProductAddon
    {
        return DB::transaction(function () use ($payload, $actor): ProductAddon {
            $addon = ProductAddon::query()->create($this->normalizeAttributes($payload, $actor->tenant_id));

            $this->syncRelations($addon, $payload);

            return $this->getForDisplay($addon);
        });
    }

    public function update(ProductAddon $addon, array $payload, User $actor): ProductAddon
    {
        return DB::transaction(function () use ($addon, $payload, $actor): ProductAddon {
            $addon->fill($this->normalizeAttributes($payload, $actor->tenant_id, $addon));
            $addon->save();

            $this->syncRelations($addon, $payload);

            return $this->getForDisplay($addon);
        });
    }

    public function delete(ProductAddon $addon): void
    {
        $addon->delete();
    }

    private function normalizeAttributes(array $payload, string $tenantId, ?ProductAddon $addon = null): array
    {
        $slug = filled($payload['slug'] ?? null)
            ? Str::slug((string) $payload['slug'])
            : Str::slug((string) $payload['name']);

        return [
            'tenant_id' => $addon?->tenant_id ?? $tenantId,
            'name' => trim((string) $payload['name']),
            'slug' => $slug,
            'description' => $payload['description'] ?? null,
            'status' => $payload['status'],
            'visibility' => $payload['visibility'],
            'apply_tax' => (bool) ($payload['apply_tax'] ?? false),
            'auto_activate' => (bool) ($payload['auto_activate'] ?? false),
            'welcome_email' => $payload['welcome_email'] ?? null,
        ];
    }

    private function syncRelations(ProductAddon $addon, array $payload): void
    {
        $addon->products()->syncWithPivotValues(
            $payload['product_ids'] ?? [],
            ['tenant_id' => $addon->tenant_id]
        );

        $retainedIds = [];
        $existingPricing = $addon->pricing()->get()->keyBy('billing_cycle');

        foreach ($payload['pricing'] as $row) {
            $pricing = $existingPricing->get($row['billing_cycle']);
            $attributes = [
                'tenant_id' => $addon->tenant_id,
                'billing_cycle' => $row['billing_cycle'],
                'currency' => Str::upper((string) $row['currency']),
                'price' => number_format((float) $row['price'], 2, '.', ''),
                'setup_fee' => number_format((float) ($row['setup_fee'] ?? 0), 2, '.', ''),
                'is_enabled' => (bool) ($row['is_enabled'] ?? false),
            ];

            if ($pricing) {
                $pricing->fill($attributes)->save();
                $retainedIds[] = $pricing->getKey();
                continue;
            }

            $created = $addon->pricing()->create($attributes);
            $retainedIds[] = $created->getKey();
        }

        if ($retainedIds !== []) {
            $addon->pricing()->whereNotIn('id', $retainedIds)->delete();
        } else {
            $addon->pricing()->delete();
        }
    }
}
