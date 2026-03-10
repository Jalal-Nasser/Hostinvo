<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use App\Support\Security\ContentSanitizer;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    use HasFactory;
    use TenantAware;

    protected $fillable = [
        'tenant_id',
        'event',
        'locale',
        'subject',
        'body_html',
        'body_text',
        'is_enabled',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
        ];
    }

    protected function subject(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => app(ContentSanitizer::class)->plainText($value)
        );
    }

    protected function bodyHtml(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => app(ContentSanitizer::class)->templateHtml($value)
        );
    }

    protected function bodyText(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => app(ContentSanitizer::class)->plainText($value)
        );
    }
}
