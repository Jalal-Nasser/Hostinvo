<?php

namespace App\Support\Security;

use HTMLPurifier;
use HTMLPurifier_Config;
use Illuminate\Support\Facades\File;

class ContentSanitizer
{
    /**
     * @var array<string, HTMLPurifier>
     */
    private array $purifiers = [];

    public function plainText(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $purified = $this->purifier('plain_text')->purify(
            $this->stripDangerousBlocks($value)
        );

        $sanitized = html_entity_decode(strip_tags($purified), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $sanitized = str_replace(["\r\n", "\r"], "\n", $sanitized);
        $sanitized = preg_replace("/[^\S\n]+/u", ' ', $sanitized) ?? $sanitized;
        $sanitized = preg_replace("/\n{3,}/u", "\n\n", $sanitized) ?? $sanitized;
        $sanitized = trim($sanitized);

        return $sanitized === '' ? null : $sanitized;
    }

    public function templateHtml(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $sanitized = trim($this->purifier('template_html')->purify(
            $this->stripDangerousBlocks($value)
        ));
        $sanitized = $this->restoreTemplatePlaceholders($sanitized);

        return $sanitized === '' ? null : $sanitized;
    }

    private function purifier(string $profile): HTMLPurifier
    {
        if (isset($this->purifiers[$profile])) {
            return $this->purifiers[$profile];
        }

        return $this->purifiers[$profile] = new HTMLPurifier(
            $this->configFor($profile)
        );
    }

    private function configFor(string $profile): HTMLPurifier_Config
    {
        $cachePath = (string) config('content_sanitization.cache_path');

        if ($cachePath !== '' && ! File::exists($cachePath)) {
            File::ensureDirectoryExists($cachePath);
        }

        $config = HTMLPurifier_Config::createDefault();
        $config->set('Core.Encoding', 'UTF-8');
        $config->set('Cache.SerializerPath', $cachePath);
        $config->set('HTML.Doctype', 'HTML 4.01 Transitional');
        $config->set('Attr.EnableID', false);
        $config->set('CSS.AllowTricky', false);
        $config->set('HTML.SafeIframe', false);
        $config->set('HTML.SafeObject', false);
        $config->set('URI.AllowedSchemes', (array) config("content_sanitization.profiles.{$profile}.allowed_schemes", []));
        $config->set('HTML.Allowed', (string) config("content_sanitization.profiles.{$profile}.allowed_html", ''));
        $config->set('HTML.ForbiddenElements', ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form']);
        $config->set('AutoFormat.RemoveEmpty', true);

        return $config;
    }

    private function stripDangerousBlocks(string $value): string
    {
        $patterns = [
            '#<\s*(script|style|iframe|object|embed|svg|math|noscript|template)[^>]*>.*?<\s*/\s*\1\s*>#is',
            '#<\s*(script|style|iframe|object|embed|svg|math|noscript|template)[^>]*/?\s*>#is',
        ];

        return trim((string) preg_replace($patterns, ' ', $value));
    }

    private function restoreTemplatePlaceholders(string $value): string
    {
        return (string) preg_replace_callback(
            '/%7B%7B.*?%7D%7D/i',
            static fn (array $matches): string => rawurldecode($matches[0]),
            $value,
        );
    }
}
