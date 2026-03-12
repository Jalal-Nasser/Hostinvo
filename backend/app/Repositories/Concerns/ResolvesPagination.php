<?php

namespace App\Repositories\Concerns;

trait ResolvesPagination
{
    protected function resolvePerPage(array $filters): int
    {
        $default = max(1, (int) config('hostinvo.performance.pagination.default_per_page', 15));
        $max = max($default, (int) config('hostinvo.performance.pagination.max_per_page', 100));

        $requested = (int) ($filters['per_page'] ?? $default);

        if ($requested <= 0) {
            return $default;
        }

        return min($requested, $max);
    }
}
