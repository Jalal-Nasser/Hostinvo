<?php

namespace App\Http\Resources\Support;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $department = $this->resource->relationLoaded('department')
            ? $this->resource->getRelation('department')
            : null;
        $status = $this->resource->relationLoaded('status')
            ? $this->resource->getRelation('status')
            : null;
        $client = $this->resource->relationLoaded('client')
            ? $this->resource->getRelation('client')
            : null;
        $clientContact = $this->resource->relationLoaded('clientContact')
            ? $this->resource->getRelation('clientContact')
            : null;
        $openedBy = $this->resource->relationLoaded('openedBy')
            ? $this->resource->getRelation('openedBy')
            : null;
        $assignedTo = $this->resource->relationLoaded('assignedTo')
            ? $this->resource->getRelation('assignedTo')
            : null;
        $service = $this->resource->relationLoaded('service')
            ? $this->resource->getRelation('service')
            : null;

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'department_id' => $this->department_id,
            'status_id' => $this->status_id,
            'client_id' => $this->client_id,
            'client_contact_id' => $this->client_contact_id,
            'opened_by_user_id' => $this->opened_by_user_id,
            'assigned_to_user_id' => $this->assigned_to_user_id,
            'service_id' => $this->service_id,
            'ticket_number' => $this->ticket_number,
            'subject' => $this->subject,
            'priority' => $this->priority,
            'source' => $this->source,
            'status_value' => $this->resource->status,
            'last_reply_by' => $this->last_reply_by,
            'last_reply_at' => optional($this->last_reply_at)?->toIso8601String(),
            'last_client_reply_at' => optional($this->last_client_reply_at)?->toIso8601String(),
            'last_admin_reply_at' => optional($this->last_admin_reply_at)?->toIso8601String(),
            'closed_at' => optional($this->closed_at)?->toIso8601String(),
            'metadata' => $this->metadata,
            'replies_count' => $this->whenCounted('replies'),
            'department' => $department ? [
                'id' => $department->id,
                'name' => $department->name,
                'slug' => $department->slug,
                'is_active' => $department->is_active,
            ] : null,
            'status' => $status ? [
                'id' => $status->id,
                'name' => $status->name,
                'code' => $status->code,
                'color' => $status->color,
                'is_closed' => $status->is_closed,
            ] : null,
            'client' => $client ? [
                'id' => $client->id,
                'display_name' => $client->display_name,
                'email' => $client->email,
                'preferred_locale' => $client->preferred_locale,
            ] : null,
            'client_contact' => $clientContact ? [
                'id' => $clientContact->id,
                'first_name' => $clientContact->first_name,
                'last_name' => $clientContact->last_name,
                'email' => $clientContact->email,
            ] : null,
            'opened_by' => $openedBy ? [
                'id' => $openedBy->id,
                'name' => $openedBy->name,
                'email' => $openedBy->email,
            ] : null,
            'assigned_to' => $assignedTo ? [
                'id' => $assignedTo->id,
                'name' => $assignedTo->name,
                'email' => $assignedTo->email,
            ] : null,
            'service' => $service ? [
                'id' => $service->id,
                'reference_number' => $service->reference_number,
                'status' => $service->status,
                'domain' => $service->domain,
            ] : null,
            'replies' => TicketReplyResource::collection($this->whenLoaded('replies')),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
