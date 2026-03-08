<?php

namespace App\Http\Resources\Support;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'department_id' => $this->department_id,
            'status_id' => $this->status_id,
            'client_id' => $this->client_id,
            'client_contact_id' => $this->client_contact_id,
            'opened_by_user_id' => $this->opened_by_user_id,
            'assigned_to_user_id' => $this->assigned_to_user_id,
            'ticket_number' => $this->ticket_number,
            'subject' => $this->subject,
            'priority' => $this->priority,
            'source' => $this->source,
            'last_reply_by' => $this->last_reply_by,
            'last_reply_at' => optional($this->last_reply_at)?->toIso8601String(),
            'last_client_reply_at' => optional($this->last_client_reply_at)?->toIso8601String(),
            'last_admin_reply_at' => optional($this->last_admin_reply_at)?->toIso8601String(),
            'closed_at' => optional($this->closed_at)?->toIso8601String(),
            'metadata' => $this->metadata,
            'replies_count' => $this->whenCounted('replies'),
            'department' => $this->whenLoaded('department', fn () => $this->department ? [
                'id' => $this->department->id,
                'name' => $this->department->name,
                'slug' => $this->department->slug,
                'is_active' => $this->department->is_active,
            ] : null),
            'status' => $this->whenLoaded('status', fn () => $this->status ? [
                'id' => $this->status->id,
                'name' => $this->status->name,
                'code' => $this->status->code,
                'color' => $this->status->color,
                'is_closed' => $this->status->is_closed,
            ] : null),
            'client' => $this->whenLoaded('client', fn () => $this->client ? [
                'id' => $this->client->id,
                'display_name' => $this->client->display_name,
                'email' => $this->client->email,
                'preferred_locale' => $this->client->preferred_locale,
            ] : null),
            'client_contact' => $this->whenLoaded('clientContact', fn () => $this->clientContact ? [
                'id' => $this->clientContact->id,
                'first_name' => $this->clientContact->first_name,
                'last_name' => $this->clientContact->last_name,
                'email' => $this->clientContact->email,
            ] : null),
            'opened_by' => $this->whenLoaded('openedBy', fn () => $this->openedBy ? [
                'id' => $this->openedBy->id,
                'name' => $this->openedBy->name,
                'email' => $this->openedBy->email,
            ] : null),
            'assigned_to' => $this->whenLoaded('assignedTo', fn () => $this->assignedTo ? [
                'id' => $this->assignedTo->id,
                'name' => $this->assignedTo->name,
                'email' => $this->assignedTo->email,
            ] : null),
            'replies' => TicketReplyResource::collection($this->whenLoaded('replies')),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
