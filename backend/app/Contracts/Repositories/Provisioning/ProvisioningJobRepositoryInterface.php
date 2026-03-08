<?php

namespace App\Contracts\Repositories\Provisioning;

use App\Models\ProvisioningJob;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProvisioningJobRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?ProvisioningJob;

    public function findByIdForDisplay(string $id): ?ProvisioningJob;

    public function create(array $attributes): ProvisioningJob;

    public function update(ProvisioningJob $job, array $attributes): ProvisioningJob;
}
