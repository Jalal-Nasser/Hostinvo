<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\IndexProductGroupRequest;
use App\Http\Requests\Catalog\StoreProductGroupRequest;
use App\Http\Requests\Catalog\UpdateProductGroupRequest;
use App\Http\Resources\Catalog\ProductGroupResource;
use App\Models\ProductGroup;
use App\Services\Catalog\ProductGroupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ProductGroupController extends Controller
{
    public function index(
        IndexProductGroupRequest $request,
        ProductGroupService $productGroupService
    ): AnonymousResourceCollection {
        return ProductGroupResource::collection(
            $productGroupService->paginate($request->validated())
        );
    }

    public function store(
        StoreProductGroupRequest $request,
        ProductGroupService $productGroupService
    ): JsonResponse {
        $group = $productGroupService->create($request->validated(), $request->user());

        return (new ProductGroupResource($group))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(ProductGroup $productGroup, ProductGroupService $productGroupService): ProductGroupResource
    {
        $this->authorize('view', $productGroup);

        return new ProductGroupResource(
            $productGroupService->getForDisplay($productGroup)
        );
    }

    public function update(
        UpdateProductGroupRequest $request,
        ProductGroup $productGroup,
        ProductGroupService $productGroupService
    ): ProductGroupResource {
        return new ProductGroupResource(
            $productGroupService->update($productGroup, $request->validated(), $request->user())
        );
    }

    public function destroy(ProductGroup $productGroup, ProductGroupService $productGroupService): Response
    {
        $this->authorize('delete', $productGroup);

        $productGroupService->delete($productGroup);

        return response()->noContent();
    }
}
