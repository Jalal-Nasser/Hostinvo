<?php

namespace App\Domains\Contracts;

use App\Domains\Data\RegistrarOperationResult;
use App\Models\Domain;

interface RegistrarDriverInterface
{
    public function renew(Domain $domain, int $years): RegistrarOperationResult;

    public function updateContacts(Domain $domain, array $contacts): RegistrarOperationResult;

    public function syncStatus(Domain $domain): RegistrarOperationResult;
}
