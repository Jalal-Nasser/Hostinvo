<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;
use Throwable;

class ServiceCredential extends Model
{
    use HasFactory;
    use TenantAware;

    protected $guarded = [
        'tenant_id',
        'service_id',
        'key',
        'value',
        'credentials',
        'control_panel_url',
        'access_url',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'credentials' => 'encrypted:array',
            'metadata' => 'array',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function decryptValue(): ?string
    {
        if (blank($this->value)) {
            return is_string($this->credentials['password'] ?? null)
                ? $this->credentials['password']
                : null;
        }

        try {
            return Crypt::decryptString($this->value);
        } catch (Throwable) {
            return null;
        }
    }

    public function storeSecret(string $value): void
    {
        $this->value = Crypt::encryptString($value);
    }
}
