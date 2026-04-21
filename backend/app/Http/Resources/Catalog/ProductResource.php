<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
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
            'product_group_id' => $this->product_group_id,
            'server_id' => $this->server_id,
            'type' => $this->type,
            'provisioning_module' => $this->provisioning_module,
            'provisioning_package' => $this->provisioning_package,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'summary' => $this->summary,
            'description' => $this->description,
            'status' => $this->status,
            'visibility' => $this->visibility,
            'display_order' => $this->display_order,
            'is_featured' => $this->is_featured,
            'starting_price' => $startingPrice ? [
                'billing_cycle' => $startingPrice->billing_cycle,
                'currency' => $startingPrice->currency,
                'price' => $startingPrice->price,
            ] : null,
            'group' => $this->when($this->group, [
                'id' => $this->group?->id,
                'name' => $this->group?->name,
                'slug' => $this->group?->slug,
            ]),
            'server' => $this->whenLoaded('server', fn () => $this->server ? [
                'id' => $this->server->id,
                'name' => $this->server->name,
                'hostname' => $this->server->hostname,
                'panel_type' => $this->server->panel_type,
                'status' => $this->server->status,
            ] : null),
            'pricing_count' => $this->whenCounted('pricing'),
            'configurable_options_count' => $this->whenCounted('configurableOptions'),
            'pricing' => ProductPricingResource::collection($this->whenLoaded('pricing')),
            'configurable_options' => ConfigurableOptionResource::collection($this->whenLoaded('configurableOptions')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
