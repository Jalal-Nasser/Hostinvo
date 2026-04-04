<?php

use App\Http\Controllers\Api\V1\Client\DomainContactController;
use App\Http\Controllers\Api\V1\Client\DomainController;
use App\Http\Controllers\Api\V1\Client\DomainRenewalController;
use App\Http\Controllers\Api\V1\Client\InvoiceController;
use App\Http\Controllers\Api\V1\Client\PortalAnnouncementController;
use App\Http\Controllers\Api\V1\Client\PortalConfigController;
use App\Http\Controllers\Api\V1\Client\PortalContentBlockController;
use App\Http\Controllers\Api\V1\Client\PortalKnowledgeBaseController;
use App\Http\Controllers\Api\V1\Client\PortalNetworkIncidentController;
use App\Http\Controllers\Api\V1\Client\ServiceController;
use App\Http\Controllers\Api\V1\Client\SupportOverviewController;
use App\Http\Controllers\Api\V1\Client\TicketController;
use App\Http\Controllers\Api\V1\Client\TicketDepartmentController;
use App\Http\Controllers\Api\V1\Client\TicketReplyController;
use App\Http\Controllers\Api\V1\Client\TicketServiceController;
use Illuminate\Support\Facades\Route;

Route::get('support/overview', SupportOverviewController::class)->name('support.overview.show');
Route::get('ticket-departments', [TicketDepartmentController::class, 'index'])->name('ticket-departments.index');
Route::get('ticket-services', [TicketServiceController::class, 'index'])->name('ticket-services.index');
Route::post('tickets/{ticket}/replies', [TicketReplyController::class, 'store'])
    ->middleware('throttle:ticket-reply')
    ->name('tickets.replies.store');
Route::apiResource('tickets', TicketController::class)
    ->only(['index', 'show', 'store'])
    ->middlewareFor('store', 'throttle:ticket-create');
Route::apiResource('invoices', InvoiceController::class)->only(['index', 'show']);
Route::apiResource('services', ServiceController::class)->only(['index', 'show']);
Route::get('portal/config', PortalConfigController::class)->name('portal.config.show');
Route::get('portal/announcements', [PortalAnnouncementController::class, 'index'])->name('portal.announcements.index');
Route::get('portal/knowledgebase', [PortalKnowledgeBaseController::class, 'index'])->name('portal.knowledgebase.index');
Route::get('portal/network-incidents', [PortalNetworkIncidentController::class, 'index'])->name('portal.network-incidents.index');
Route::get('portal/content-blocks', [PortalContentBlockController::class, 'index'])->name('portal.content-blocks.index');

Route::get('domains/{domain}/contacts', [DomainContactController::class, 'index'])->name('domains.contacts.index');
Route::put('domains/{domain}/contacts', [DomainContactController::class, 'update'])->name('domains.contacts.update');
Route::get('domains/{domain}/renewals', [DomainRenewalController::class, 'index'])->name('domains.renewals.index');
Route::apiResource('domains', DomainController::class)
    ->only(['index', 'show'])
    ->middlewareFor('index', 'throttle:domain-list');
