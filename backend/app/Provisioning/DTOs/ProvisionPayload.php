<?php

namespace App\Provisioning\DTOs;

readonly class ProvisionPayload
{
    public function __construct(
        public string $serviceId,
        public string $username,
        public string $domain,
        public string $email,
        public string $password,
        public string $packageName,
        public string $ip,
        public ?string $contactEmail = null,
    ) {
    }

    public function sanitized(): array
    {
        return [
            'service_id' => $this->serviceId,
            'username' => $this->username,
            'domain' => $this->domain,
            'email' => $this->email,
            'package_name' => $this->packageName,
            'ip' => $this->ip,
            'contact_email' => $this->contactEmail,
        ];
    }
}
