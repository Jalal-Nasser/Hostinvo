<?php

namespace App\Http\Resources\Support;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketReplyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'ticket_id' => $this->ticket_id,
            'user_id' => $this->user_id,
            'client_contact_id' => $this->client_contact_id,
            'reply_type' => $this->reply_type,
            'is_internal' => $this->is_internal,
            'message' => $this->message,
            'metadata' => $this->metadata,
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null),
            'client_contact' => $this->whenLoaded('clientContact', fn () => $this->clientContact ? [
                'id' => $this->clientContact->id,
                'first_name' => $this->clientContact->first_name,
                'last_name' => $this->clientContact->last_name,
                'email' => $this->clientContact->email,
            ] : null),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
