<?php

declare(strict_types=1);

namespace App\Support\Security;

/**
 * Minimal CBOR (RFC 7049) decoder sufficient for WebAuthn COSE key extraction.
 *
 * Handles only the subset of CBOR used by WebAuthn:
 *   - Major type 0 — unsigned integer
 *   - Major type 1 — negative integer
 *   - Major type 2 — byte string
 *   - Major type 3 — text string
 *   - Major type 4 — array
 *   - Major type 5 — map
 *
 * Indefinite-length items and floating-point numbers are not supported
 * because authenticators do not emit them in attested credential data.
 */
final class CborDecoder
{
    /**
     * Decode a CBOR-encoded byte string and return the native PHP value.
     *
     * @throws \RuntimeException on malformed or unsupported CBOR input
     */
    public static function decode(string $bytes): mixed
    {
        $offset = 0;

        $value = self::parseItem($bytes, $offset);

        // Caller may pass a slice of a larger buffer; leftover bytes are fine.
        return $value;
    }

    // -----------------------------------------------------------------------
    // Internal parsing
    // -----------------------------------------------------------------------

    private static function parseItem(string $bytes, int &$offset): mixed
    {
        self::assertLength($bytes, $offset, 1);

        $initialByte = ord($bytes[$offset++]);
        $majorType   = ($initialByte >> 5) & 0x07;
        $additional  = $initialByte & 0x1f;

        $argument = self::parseArgument($bytes, $offset, $additional);

        return match ($majorType) {
            0 => $argument,                                        // unsigned int
            1 => -1 - $argument,                                   // negative int
            2 => self::readBytes($bytes, $offset, (int) $argument), // byte string
            3 => self::readBytes($bytes, $offset, (int) $argument), // text string (returned as raw PHP string)
            4 => self::parseArray($bytes, $offset, (int) $argument),
            5 => self::parseMap($bytes, $offset, (int) $argument),
            default => throw new \RuntimeException(
                sprintf('Unsupported CBOR major type %d at offset %d', $majorType, $offset - 1)
            ),
        };
    }

    /**
     * Decode the argument value from the additional-info field.
     * Returns the integer represented by the argument (count, length, or value).
     */
    private static function parseArgument(string $bytes, int &$offset, int $additional): int
    {
        // Direct value (0–23)
        if ($additional < 24) {
            return $additional;
        }

        // 1-byte argument
        if ($additional === 24) {
            self::assertLength($bytes, $offset, 1);

            return ord($bytes[$offset++]);
        }

        // 2-byte argument (big-endian)
        if ($additional === 25) {
            self::assertLength($bytes, $offset, 2);
            $value = unpack('n', substr($bytes, $offset, 2))[1];
            $offset += 2;

            return (int) $value;
        }

        // 4-byte argument (big-endian)
        if ($additional === 26) {
            self::assertLength($bytes, $offset, 4);
            $value = unpack('N', substr($bytes, $offset, 4))[1];
            $offset += 4;

            return (int) $value;
        }

        // 8-byte argument (big-endian, unsigned 64-bit)
        if ($additional === 27) {
            self::assertLength($bytes, $offset, 8);
            $value = unpack('J', substr($bytes, $offset, 8))[1];
            $offset += 8;

            // PHP integers are 64-bit signed; very large uint64 values would
            // wrap, but WebAuthn counters and key lengths never reach 2^63.
            return (int) $value;
        }

        // 31 = indefinite-length (break code) — not used in WebAuthn
        throw new \RuntimeException(
            sprintf('Unsupported CBOR additional info %d at offset %d', $additional, $offset - 1)
        );
    }

    /**
     * Read exactly $length bytes from $bytes starting at $offset.
     */
    private static function readBytes(string $bytes, int &$offset, int $length): string
    {
        self::assertLength($bytes, $offset, $length);
        $chunk   = substr($bytes, $offset, $length);
        $offset += $length;

        return $chunk;
    }

    /**
     * Parse a CBOR definite-length array of $count items.
     *
     * @return list<mixed>
     */
    private static function parseArray(string $bytes, int &$offset, int $count): array
    {
        $result = [];

        for ($i = 0; $i < $count; $i++) {
            $result[] = self::parseItem($bytes, $offset);
        }

        return $result;
    }

    /**
     * Parse a CBOR definite-length map of $count key/value pairs.
     *
     * Map keys are preserved as their native PHP values (typically int or
     * string). COSE keys are always integers, so PHP array syntax works.
     *
     * @return array<int|string, mixed>
     */
    private static function parseMap(string $bytes, int &$offset, int $count): array
    {
        $result = [];

        for ($i = 0; $i < $count; $i++) {
            $key          = self::parseItem($bytes, $offset);
            $value        = self::parseItem($bytes, $offset);
            $result[$key] = $value;
        }

        return $result;
    }

    /**
     * Throw if fewer than $need bytes remain at $offset.
     */
    private static function assertLength(string $bytes, int $offset, int $need): void
    {
        if ($offset + $need > strlen($bytes)) {
            throw new \RuntimeException(
                sprintf(
                    'CBOR buffer underrun: need %d byte(s) at offset %d, but buffer length is %d',
                    $need,
                    $offset,
                    strlen($bytes)
                )
            );
        }
    }
}
