<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConfigurableOptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'option_type' => $this->option_type,
            'description' => $this->description,
            'status' => $this->status,
            'is_required' => $this->is_required,
            'display_order' => $this->display_order,
            'choices' => ConfigurableOptionChoiceResource::collection($this->whenLoaded('choices')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
