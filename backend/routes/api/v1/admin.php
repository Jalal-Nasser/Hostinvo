<?php

use App\Http\Controllers\Api\V1\Admin\ClientController;
use Illuminate\Support\Facades\Route;

Route::apiResource('clients', ClientController::class);
