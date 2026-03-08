<?php

use App\Http\Controllers\Api\V1\Client\DomainContactController;
use App\Http\Controllers\Api\V1\Client\DomainController;
use App\Http\Controllers\Api\V1\Client\DomainRenewalController;
use Illuminate\Support\Facades\Route;

Route::get('domains/{domain}/contacts', [DomainContactController::class, 'index'])->name('domains.contacts.index');
Route::put('domains/{domain}/contacts', [DomainContactController::class, 'update'])->name('domains.contacts.update');
Route::get('domains/{domain}/renewals', [DomainRenewalController::class, 'index'])->name('domains.renewals.index');
Route::apiResource('domains', DomainController::class)->only(['index', 'show']);
