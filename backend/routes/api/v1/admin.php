<?php

use App\Http\Controllers\Api\V1\Admin\ClientController;
use App\Http\Controllers\Api\V1\Admin\ProductController;
use App\Http\Controllers\Api\V1\Admin\ProductGroupController;
use App\Http\Controllers\Api\V1\Admin\ProductPricingController;
use Illuminate\Support\Facades\Route;

Route::apiResource('clients', ClientController::class);
Route::apiResource('product-groups', ProductGroupController::class);
Route::apiResource('products', ProductController::class);
Route::get('products/{product}/pricing', [ProductPricingController::class, 'show'])->name('products.pricing.show');
Route::put('products/{product}/pricing', [ProductPricingController::class, 'update'])->name('products.pricing.update');
