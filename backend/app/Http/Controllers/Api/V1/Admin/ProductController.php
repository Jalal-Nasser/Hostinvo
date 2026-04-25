<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\IndexProductRequest;
use App\Http\Requests\Catalog\StoreProductRequest;
use App\Http\Requests\Catalog\UpdateProductRequest;
use App\Http\Resources\Catalog\ProductResource;
use App\Models\Product;
use App\Services\Catalog\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    public function index(IndexProductRequest $request, ProductService $productService): AnonymousResourceCollection
    {
        return ProductResource::collection(
            $productService->paginate($request->validated())
        );
    }

    public function store(StoreProductRequest $request, ProductService $productService): JsonResponse
    {
        $product = $productService->create($request->validated(), $request->user());

        return (new ProductResource($product))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Product $product, ProductService $productService): ProductResource
    {
        $this->authorize('view', $product);

        return new ProductResource(
            $productService->getForDisplay($product)
        );
    }

    public function update(
        UpdateProductRequest $request,
        Product $product,
        ProductService $productService
    ): ProductResource {
        return new ProductResource(
            $productService->update($product, $request->validated(), $request->user())
        );
    }

    public function duplicate(Product $product, ProductService $productService): JsonResponse
    {
        $this->authorize('create', Product::class);
        $this->authorize('view', $product);

        $copy = $productService->duplicate($product, request()->user());

        return (new ProductResource($copy))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function destroy(Product $product, ProductService $productService): Response
    {
        $this->authorize('delete', $product);

        $productService->delete($product);

        return response()->noContent();
    }
}
