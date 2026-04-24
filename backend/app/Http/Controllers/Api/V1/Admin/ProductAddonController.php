<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\IndexProductAddonRequest;
use App\Http\Requests\Catalog\StoreProductAddonRequest;
use App\Http\Requests\Catalog\UpdateProductAddonRequest;
use App\Http\Resources\Catalog\ProductAddonResource;
use App\Models\ProductAddon;
use App\Services\Catalog\ProductAddonService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ProductAddonController extends Controller
{
    public function index(IndexProductAddonRequest $request, ProductAddonService $service): AnonymousResourceCollection
    {
        return ProductAddonResource::collection(
            $service->paginate($request->validated())
        );
    }

    public function store(StoreProductAddonRequest $request, ProductAddonService $service): JsonResponse
    {
        $addon = $service->create($request->validated(), $request->user());

        return (new ProductAddonResource($addon))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(ProductAddon $productAddon, ProductAddonService $service): ProductAddonResource
    {
        $this->authorize('view', $productAddon);

        return new ProductAddonResource($service->getForDisplay($productAddon));
    }

    public function update(
        UpdateProductAddonRequest $request,
        ProductAddon $productAddon,
        ProductAddonService $service,
    ): ProductAddonResource {
        return new ProductAddonResource(
            $service->update($productAddon, $request->validated(), $request->user())
        );
    }

    public function destroy(ProductAddon $productAddon, ProductAddonService $service): Response
    {
        $this->authorize('delete', $productAddon);

        $service->delete($productAddon);

        return response()->noContent();
    }
}
