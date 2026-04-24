<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductAddonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $startingPrice = $this->relationLoaded('pricing')
            ? $this->pricing
                ->where('is_enabled', true)
                ->sortBy('price')
                ->first()
            : null;

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'status' => $this->status,
            'visibility' => $this->visibility,
            'apply_tax' => $this->apply_tax,
            'auto_activate' => $this->auto_activate,
            'welcome_email' => $this->welcome_email,
            'starting_price' => $startingPrice ? [
                'billing_cycle' => $startingPrice->billing_cycle,
                'currency' => $startingPrice->currency,
                'price' => $startingPrice->price,
            ] : null,
            'products' => $this->whenLoaded('products', fn () => $this->products->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
            ])->values()),
            'pricing' => ProductAddonPricingResource::collection($this->whenLoaded('pricing')),
            'products_count' => $this->whenCounted('products'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
