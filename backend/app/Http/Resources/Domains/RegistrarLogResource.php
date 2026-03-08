<?php

namespace App\Http\Resources\Domains;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegistrarLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'domain_id' => $this->domain_id,
            'operation' => $this->operation,
            'status' => $this->status,
            'request_payload' => $this->request_payload,
            'response_payload' => $this->response_payload,
            'error_message' => $this->error_message,
            'created_at' => optional($this->created_at)?->toIso8601String(),
        ];
    }
}
