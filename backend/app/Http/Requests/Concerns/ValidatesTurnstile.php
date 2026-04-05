<?php

namespace App\Http\Requests\Concerns;

use App\Services\Security\TurnstileService;
use Illuminate\Validation\Validator;

trait ValidatesTurnstile
{
    public function after(): array
    {
        $callbacks = [];

        if (is_callable('parent::after')) {
            $callbacks = parent::after();
        }

        return [
            ...$callbacks,
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $form = $this->turnstileFormKey();

                if (! $form) {
                    return;
                }

                if (! app(TurnstileService::class)->verifyRequest($this, $form)) {
                    $validator->errors()->add('turnstile_token', __('auth.turnstile_failed'));
                }
            },
        ];
    }

    abstract protected function turnstileFormKey(): ?string;
}
