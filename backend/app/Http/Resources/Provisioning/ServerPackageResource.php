<?php

namespace App\Http\Resources\Provisioning;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServerPackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'server_id' => $this->server_id,
            'product_id' => $this->product_id,
            'panel_package_name' => $this->panel_package_name,
            'display_name' => $this->display_name,
            'is_default' => $this->is_default,
            'metadata' => $this->metadata,
            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
                'type' => $this->product->type,
            ] : null),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
