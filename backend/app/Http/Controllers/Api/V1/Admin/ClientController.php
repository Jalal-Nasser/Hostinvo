<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clients\IndexClientRequest;
use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Http\Resources\Clients\ClientResource;
use App\Models\Client;
use App\Services\Clients\ClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ClientController extends Controller
{
    public function index(IndexClientRequest $request, ClientService $clientService): AnonymousResourceCollection
    {
        return ClientResource::collection(
            $clientService->paginate($request->validated())
        );
    }

    public function store(StoreClientRequest $request, ClientService $clientService): JsonResponse
    {
        $client = $clientService->create($request->validated(), $request->user());

        return (new ClientResource($client))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Client $client, ClientService $clientService): ClientResource
    {
        $this->authorize('view', $client);

        return new ClientResource(
            $clientService->getForDisplay($client)
        );
    }

    public function update(UpdateClientRequest $request, Client $client, ClientService $clientService): ClientResource
    {
        return new ClientResource(
            $clientService->update($client, $request->validated(), $request->user())
        );
    }

    public function destroy(Client $client, ClientService $clientService): Response
    {
        $this->authorize('delete', $client);

        $clientService->delete($client, request()->user());

        return response()->noContent();
    }
}
