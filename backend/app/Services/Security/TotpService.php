<?php

namespace App\Services\Security;

use App\Models\User;
use RuntimeException;

class TotpService
{
    public function generateSecret(int $length = 32): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';

        for ($index = 0; $index < $length; $index++) {
            $secret .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        return $secret;
    }

    public function buildOtpAuthUrl(User $user, string $secret): string
    {
        $issuer = rawurlencode((string) config('security.mfa.issuer', config('app.name', 'Hostinvo')));
        $label = rawurlencode(sprintf('%s:%s', config('app.name', 'Hostinvo'), $user->email));

        return sprintf(
            'otpauth://totp/%s?secret=%s&issuer=%s&period=%d&digits=6',
            $label,
            rawurlencode($secret),
            $issuer,
            (int) config('security.mfa.time_step', 30),
        );
    }

    public function verifyCode(string $secret, string $code): bool
    {
        $normalizedCode = preg_replace('/\s+/', '', trim($code));

        if (! preg_match('/^\d{6}$/', (string) $normalizedCode)) {
            return false;
        }

        $window = (int) config('security.mfa.window', 1);

        for ($offset = -$window; $offset <= $window; $offset++) {
            if (hash_equals($this->at($secret, $offset), (string) $normalizedCode)) {
                return true;
            }
        }

        return false;
    }

    private function at(string $secret, int $offset = 0): string
    {
        $counter = (int) floor(time() / (int) config('security.mfa.time_step', 30)) + $offset;
        $binarySecret = $this->base32Decode($secret);
        $binaryCounter = pack('N*', 0) . pack('N*', $counter);
        $hash = hash_hmac('sha1', $binaryCounter, $binarySecret, true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $segment = substr($hash, $offset, 4);
        $value = unpack('N', $segment)[1] & 0x7fffffff;

        return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
    }

    private function base32Decode(string $secret): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $cleaned = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret) ?? '');
        $buffer = 0;
        $bitsLeft = 0;
        $output = '';

        foreach (str_split($cleaned) as $character) {
            $position = strpos($alphabet, $character);

            if ($position === false) {
                throw new RuntimeException('Invalid base32 secret.');
            }

            $buffer = ($buffer << 5) | $position;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $output .= chr(($buffer >> $bitsLeft) & 0xff);
            }
        }

        return $output;
    }
}
