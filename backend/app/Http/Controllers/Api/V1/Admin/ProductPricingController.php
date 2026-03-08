<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\UpdateProductPricingRequest;
use App\Http\Resources\Catalog\ProductPricingResource;
use App\Models\Product;
use App\Services\Catalog\ProductService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductPricingController extends Controller
{
    public function show(Product $product, ProductService $productService): AnonymousResourceCollection
    {
        $this->authorize('view', $product);

        $product = $productService->getForDisplay($product);

        return ProductPricingResource::collection($product->pricing);
    }

    public function update(
        UpdateProductPricingRequest $request,
        Product $product,
        ProductService $productService
    ): AnonymousResourceCollection {
        $product = $productService->updatePricing($product, $request->validated());

        return ProductPricingResource::collection($product->pricing);
    }
}
