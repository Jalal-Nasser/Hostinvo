<?php

namespace App\Support\Http;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponse
{
    protected function success(
        mixed $data = null,
        array $meta = [],
        int $status = Response::HTTP_OK,
    ): JsonResponse {
        return response()->json([
            'data' => $data,
            'meta' => (object) $meta,
            'errors' => [],
        ], $status);
    }

    protected function message(
        string $message,
        int $status = Response::HTTP_OK,
        array $meta = [],
    ): JsonResponse {
        return $this->success([
            'message' => $message,
        ], $meta, $status);
    }

    protected function failure(
        string $message,
        int $status = Response::HTTP_BAD_REQUEST,
        array $errors = [],
        array $meta = [],
    ): JsonResponse {
        return response()->json([
            'data' => null,
            'meta' => (object) $meta,
            'errors' => $errors !== [] ? $errors : [['message' => $message]],
        ], $status);
    }
}
