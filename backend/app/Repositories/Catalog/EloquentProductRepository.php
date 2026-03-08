<?php

namespace App\Repositories\Catalog;

use App\Contracts\Repositories\Catalog\ProductRepositoryInterface;
use App\Models\ConfigurableOption;
use App\Models\Product;
use App\Models\ProductPricing;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;

class EloquentProductRepository implements ProductRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return Product::query()
            ->with(['group', 'pricing'])
            ->withCount(['pricing', 'configurableOptions'])
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                })
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['visibility'] ?? null),
                fn (Builder $query) => $query->where('visibility', $filters['visibility'])
            )
            ->when(
                filled($filters['type'] ?? null),
                fn (Builder $query) => $query->where('type', $filters['type'])
            )
            ->when(
                filled($filters['product_group_id'] ?? null),
                fn (Builder $query) => $query->where('product_group_id', $filters['product_group_id'])
            )
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(string $id): ?Product
    {
        return Product::query()->find($id);
    }

    public function findByIdForDisplay(string $id): ?Product
    {
        return Product::query()
            ->with([
                'group',
                'pricing' => fn ($query) => $query->orderBy('billing_cycle'),
                'configurableOptions' => fn ($query) => $query
                    ->with(['choices' => fn ($choiceQuery) => $choiceQuery->orderBy('display_order')])
                    ->orderBy('display_order'),
            ])
            ->withCount(['pricing', 'configurableOptions'])
            ->find($id);
    }

    public function create(array $attributes): Product
    {
        return Product::query()->create($attributes);
    }

    public function update(Product $product, array $attributes): Product
    {
        $product->fill($attributes);
        $product->save();

        return $product;
    }

    public function syncPricing(Product $product, array $pricing): void
    {
        $existing = $product->pricing()->get()->keyBy('billing_cycle');
        $retainedIds = [];

        foreach ($pricing as $row) {
            $cycle = $row['billing_cycle'];
            $attributes = Arr::except($row, ['id']);
            $attributes['tenant_id'] = $product->tenant_id;

            if ($existing->has($cycle)) {
                $existing->get($cycle)?->fill($attributes)->save();
                $retainedIds[] = $existing->get($cycle)?->getKey();
                continue;
            }

            $created = $product->pricing()->create($attributes);
            $retainedIds[] = $created->getKey();
        }

        if ($retainedIds !== []) {
            $product->pricing()->whereNotIn('id', $retainedIds)->delete();
            return;
        }

        $product->pricing()->delete();
    }

    public function syncConfigurableOptions(Product $product, array $options): void
    {
        $existingOptions = $product->configurableOptions()->with('choices')->get()->keyBy('id');
        $retainedOptionIds = [];

        foreach ($options as $option) {
            $optionId = $option['id'] ?? null;
            $optionAttributes = Arr::except($option, ['id', 'choices']);
            $optionAttributes['tenant_id'] = $product->tenant_id;

            if ($optionId && $existingOptions->has($optionId)) {
                $optionModel = $existingOptions->get($optionId);
                $optionModel?->fill($optionAttributes)->save();
            } else {
                $optionModel = $product->configurableOptions()->create($optionAttributes);
            }

            if (! $optionModel instanceof ConfigurableOption) {
                continue;
            }

            $retainedOptionIds[] = $optionModel->getKey();
            $existingChoices = $optionModel->choices->keyBy('id');
            $retainedChoiceIds = [];

            foreach ($option['choices'] ?? [] as $choice) {
                $choiceId = $choice['id'] ?? null;
                $choiceAttributes = Arr::except($choice, ['id']);
                $choiceAttributes['tenant_id'] = $product->tenant_id;
                $choiceAttributes['option_id'] = $optionModel->getKey();

                if ($choiceId && $existingChoices->has($choiceId)) {
                    $existingChoices->get($choiceId)?->fill($choiceAttributes)->save();
                    $retainedChoiceIds[] = $choiceId;
                    continue;
                }

                $createdChoice = $optionModel->choices()->create($choiceAttributes);
                $retainedChoiceIds[] = $createdChoice->getKey();
            }

            if ($retainedChoiceIds !== []) {
                $optionModel->choices()->whereNotIn('id', $retainedChoiceIds)->delete();
                continue;
            }

            $optionModel->choices()->delete();
        }

        if ($retainedOptionIds !== []) {
            $product->configurableOptions()->whereNotIn('id', $retainedOptionIds)->delete();
            return;
        }

        $product->configurableOptions()->delete();
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
