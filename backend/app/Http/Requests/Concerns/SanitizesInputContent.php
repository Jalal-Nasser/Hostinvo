<?php

namespace App\Http\Requests\Concerns;

use App\Support\Security\ContentSanitizer;

trait SanitizesInputContent
{
    protected function sanitizePlainTextFields(array $fields): void
    {
        $this->sanitizeFields(
            $fields,
            fn (?string $value): ?string => app(ContentSanitizer::class)->plainText($value)
        );
    }

    protected function sanitizeTemplateHtmlFields(array $fields): void
    {
        $this->sanitizeFields(
            $fields,
            fn (?string $value): ?string => app(ContentSanitizer::class)->templateHtml($value)
        );
    }

    /**
     * @param  array<int, string>  $fields
     * @param  callable(?string): ?string  $callback
     */
    private function sanitizeFields(array $fields, callable $callback): void
    {
        $input = $this->all();

        foreach ($fields as $field) {
            if (! array_key_exists($field, $input)) {
                continue;
            }

            $value = $input[$field];

            if ($value !== null && ! is_string($value)) {
                continue;
            }

            $input[$field] = $callback($value);
        }

        $this->replace($input);
    }
}
