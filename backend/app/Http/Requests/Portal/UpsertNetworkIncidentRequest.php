<?php

namespace App\Http\Requests\Portal;

use App\Models\NetworkIncident;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertNetworkIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $incident = $this->route('networkIncident');

        return $incident
            ? $this->user()->can('update', $incident)
            : $this->user()->can('create', NetworkIncident::class);
    }

    public function rules(): array
    {
        $incidentId = $this->route('networkIncident')?->id;
        $tenantId = $this->user()?->tenant_id;

        return [
            'slug' => [
                'nullable',
                'string',
                'max:160',
                'alpha_dash',
                Rule::unique('network_incidents', 'slug')->ignore($incidentId)->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'title_en' => ['required', 'string', 'max:255'],
            'title_ar' => ['nullable', 'string', 'max:255'],
            'summary_en' => ['nullable', 'string'],
            'summary_ar' => ['nullable', 'string'],
            'details_en' => ['nullable', 'string'],
            'details_ar' => ['nullable', 'string'],
            'status' => ['required', Rule::in([
                NetworkIncident::STATUS_OPEN,
                NetworkIncident::STATUS_MONITORING,
                NetworkIncident::STATUS_RESOLVED,
                NetworkIncident::STATUS_MAINTENANCE,
            ])],
            'severity' => ['required', Rule::in([
                NetworkIncident::SEVERITY_INFO,
                NetworkIncident::SEVERITY_WARNING,
                NetworkIncident::SEVERITY_CRITICAL,
            ])],
            'is_public' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'started_at' => ['nullable', 'date'],
            'resolved_at' => ['nullable', 'date', 'after_or_equal:started_at'],
        ];
    }
}
