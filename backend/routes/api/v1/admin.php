<?php

use App\Http\Controllers\Api\V1\Admin\ClientController;
use App\Http\Controllers\Api\V1\Admin\DashboardOverviewController;
use App\Http\Controllers\Api\V1\Admin\DomainContactController;
use App\Http\Controllers\Api\V1\Admin\DomainController;
use App\Http\Controllers\Api\V1\Admin\DomainRenewalController;
use App\Http\Controllers\Api\V1\Admin\AnnouncementController;
use App\Http\Controllers\Api\V1\Admin\InvoiceController;
use App\Http\Controllers\Api\V1\Admin\InvoiceGatewayController;
use App\Http\Controllers\Api\V1\Admin\InvoicePaymentController;
use App\Http\Controllers\Api\V1\Admin\KnowledgeBaseArticleController;
use App\Http\Controllers\Api\V1\Admin\KnowledgeBaseCategoryController;
use App\Http\Controllers\Api\V1\Admin\NetworkIncidentController;
use App\Http\Controllers\Api\V1\Admin\OrderCheckoutController;
use App\Http\Controllers\Api\V1\Admin\OrderController;
use App\Http\Controllers\Api\V1\Admin\PaymentController;
use App\Http\Controllers\Api\V1\Admin\PleskPlanImportController;
use App\Http\Controllers\Api\V1\Admin\PleskSubscriptionImportController;
use App\Http\Controllers\Api\V1\Admin\PortalContentBlockController;
use App\Http\Controllers\Api\V1\Admin\PortalFooterLinkController;
use App\Http\Controllers\Api\V1\Admin\PortalSurfaceController;
use App\Http\Controllers\Api\V1\Admin\ProductController;
use App\Http\Controllers\Api\V1\Admin\ProductAddonController;
use App\Http\Controllers\Api\V1\Admin\ProductGroupController;
use App\Http\Controllers\Api\V1\Admin\ProductPricingController;
use App\Http\Controllers\Api\V1\Admin\ProvisioningJobController;
use App\Http\Controllers\Api\V1\Admin\ProvisioningJobRetryController;
use App\Http\Controllers\Api\V1\Admin\RegistrarLogController;
use App\Http\Controllers\Api\V1\Admin\ServerController;
use App\Http\Controllers\Api\V1\Admin\ServerConnectionTestController;
use App\Http\Controllers\Api\V1\Admin\ServerGroupController;
use App\Http\Controllers\Api\V1\Admin\ServerPackageController;
use App\Http\Controllers\Api\V1\Admin\ServiceController;
use App\Http\Controllers\Api\V1\Admin\ServiceProvisioningController;
use App\Http\Controllers\Api\V1\Admin\SupportOverviewController;
use App\Http\Controllers\Api\V1\Admin\TenantController;
use App\Http\Controllers\Api\V1\Admin\TenantBrandingController;
use App\Http\Controllers\Api\V1\Admin\TenantImpersonationController;
use App\Http\Controllers\Api\V1\Admin\TenantMfaPolicyController;
use App\Http\Controllers\Api\V1\Admin\TenantNotificationTemplateController;
use App\Http\Controllers\Api\V1\Admin\TenantPaymentGatewayController;
use App\Http\Controllers\Api\V1\Admin\TenantTurnstileController;
use App\Http\Controllers\Api\V1\Admin\TicketController;
use App\Http\Controllers\Api\V1\Admin\TicketDepartmentController;
use App\Http\Controllers\Api\V1\Admin\TicketReplyController;
use App\Http\Controllers\Api\V1\Admin\TicketStatusController;
use App\Http\Controllers\Api\V1\Admin\WhmcsImportController;
use Illuminate\Support\Facades\Route;

Route::apiResource('announcements', AnnouncementController::class)
    ->middleware('tenant.context');
Route::apiResource('clients', ClientController::class);
Route::get('dashboard/overview', DashboardOverviewController::class)
    ->middleware('tenant.context')
    ->name('dashboard.overview.show');
Route::get('domains/{domain}/contacts', [DomainContactController::class, 'index'])->name('domains.contacts.index');
Route::put('domains/{domain}/contacts', [DomainContactController::class, 'update'])->name('domains.contacts.update');
Route::get('domains/{domain}/renewals', [DomainRenewalController::class, 'index'])->name('domains.renewals.index');
Route::post('domains/{domain}/renewals', [DomainRenewalController::class, 'store'])->name('domains.renewals.store');
Route::get('domains/{domain}/registrar-logs', [RegistrarLogController::class, 'index'])->name('domains.registrar-logs.index');
Route::apiResource('domains', DomainController::class)
    ->middlewareFor('index', 'throttle:domain-list')
    ->middlewareFor('store', 'throttle:domain-actions')
    ->middlewareFor('update', 'throttle:domain-actions')
    ->middlewareFor('destroy', 'throttle:domain-actions');
Route::get('invoices/{invoice}/gateway-options', [InvoiceGatewayController::class, 'index'])->name('invoices.gateway-options.index');
Route::post('invoices/{invoice}/gateway-checkouts', [InvoiceGatewayController::class, 'store'])->name('invoices.gateway-checkouts.store');
Route::post('invoices/{invoice}/gateway-checkouts/paypal/capture', [InvoiceGatewayController::class, 'capturePayPal'])->name('invoices.gateway-checkouts.paypal.capture');
Route::post('invoices/{invoice}/payments', [InvoicePaymentController::class, 'store'])->name('invoices.payments.store');
Route::apiResource('invoices', InvoiceController::class);
Route::post('orders/review', [OrderCheckoutController::class, 'review'])->name('orders.review');
Route::post('orders/place', [OrderCheckoutController::class, 'place'])->name('orders.place');
Route::post('orders/{order}/place', [OrderController::class, 'place'])->name('orders.place-existing');
Route::apiResource('orders', OrderController::class);
Route::get('payments', [PaymentController::class, 'index'])->name('payments.index');
Route::apiResource('knowledgebase-categories', KnowledgeBaseCategoryController::class)
    ->middleware('tenant.context')
    ->parameters([
        'knowledgebase-categories' => 'knowledgebaseCategory',
    ]);
Route::apiResource('knowledgebase-articles', KnowledgeBaseArticleController::class)
    ->middleware('tenant.context')
    ->parameters([
        'knowledgebase-articles' => 'knowledgebaseArticle',
    ]);
Route::apiResource('network-incidents', NetworkIncidentController::class)
    ->middleware('tenant.context')
    ->parameters([
        'network-incidents' => 'networkIncident',
    ]);
Route::apiResource('portal-content-blocks', PortalContentBlockController::class)
    ->middleware('tenant.context')
    ->parameters([
        'portal-content-blocks' => 'portalContentBlock',
    ]);
Route::apiResource('portal-footer-links', PortalFooterLinkController::class)
    ->middleware('tenant.context')
    ->parameters([
        'portal-footer-links' => 'portalFooterLink',
    ]);
Route::apiResource('provisioning-jobs', ProvisioningJobController::class)->only(['index', 'show']);
Route::post('provisioning-jobs/{provisioningJob}/retry', [ProvisioningJobRetryController::class, 'store'])->name('provisioning-jobs.retry');
Route::apiResource('product-groups', ProductGroupController::class);
Route::apiResource('product-addons', ProductAddonController::class)->parameters([
    'product-addons' => 'productAddon',
]);
Route::post('products/{product}/duplicate', [ProductController::class, 'duplicate'])->name('products.duplicate');
Route::apiResource('products', ProductController::class);
Route::get('products/{product}/pricing', [ProductPricingController::class, 'show'])->name('products.pricing.show');
Route::put('products/{product}/pricing', [ProductPricingController::class, 'update'])->name('products.pricing.update');
Route::apiResource('server-groups', ServerGroupController::class);
Route::post('servers/{server}/test', [ServerConnectionTestController::class, 'store'])->name('servers.test');
Route::get('servers/{server}/imports/plesk-plans', [PleskPlanImportController::class, 'index'])->name('servers.imports.plesk-plans.index');
Route::post('servers/{server}/imports/plesk-plans', [PleskPlanImportController::class, 'store'])->name('servers.imports.plesk-plans.store');
Route::get('servers/{server}/imports/plesk-subscriptions', [PleskSubscriptionImportController::class, 'index'])->name('servers.imports.plesk-subscriptions.index');
Route::post('servers/{server}/imports/plesk-subscriptions', [PleskSubscriptionImportController::class, 'store'])->name('servers.imports.plesk-subscriptions.store');
Route::put('servers/{server}/packages', [ServerPackageController::class, 'update'])->name('servers.packages.update');
Route::apiResource('servers', ServerController::class);
Route::post('services/{service}/duplicate', [ServiceController::class, 'duplicate'])->name('services.duplicate');
Route::post('services/{service}/operations/{operation}', [ServiceProvisioningController::class, 'store'])->name('services.operations.store');
Route::apiResource('services', ServiceController::class);
Route::apiResource('tenants', TenantController::class)->only(['index', 'store', 'show', 'update']);
Route::post('tenants/{tenant}/activate', [TenantController::class, 'activate'])->name('tenants.activate');
Route::post('tenants/{tenant}/suspend', [TenantController::class, 'suspend'])->name('tenants.suspend');
Route::post('tenants/{tenant}/impersonate-admin', [TenantImpersonationController::class, 'impersonateAdmin'])->name('tenants.impersonate.admin');
Route::post('tenants/{tenant}/impersonate-portal', [TenantImpersonationController::class, 'impersonatePortal'])->name('tenants.impersonate.portal');
Route::post('impersonation/stop', [TenantImpersonationController::class, 'stop'])->name('impersonation.stop');
Route::get('settings/branding', [TenantBrandingController::class, 'show'])
    ->middleware('tenant.context')
    ->name('settings.branding.show');
Route::post('settings/branding', [TenantBrandingController::class, 'update'])
    ->middleware('tenant.context')
    ->name('settings.branding.update');
Route::get('settings/security/turnstile', [TenantTurnstileController::class, 'show'])->name('settings.security.turnstile.show');
Route::put('settings/security/turnstile', [TenantTurnstileController::class, 'update'])->name('settings.security.turnstile.update');
Route::get('settings/security/mfa-policy', [TenantMfaPolicyController::class, 'show'])->name('settings.security.mfa-policy.show');
Route::put('settings/security/mfa-policy', [TenantMfaPolicyController::class, 'update'])->name('settings.security.mfa-policy.update');
Route::get('settings/payments/gateways', [TenantPaymentGatewayController::class, 'show'])
    ->middleware('tenant.context')
    ->name('settings.payments.gateways.show');
Route::put('settings/payments/gateways', [TenantPaymentGatewayController::class, 'update'])
    ->middleware('tenant.context')
    ->name('settings.payments.gateways.update');
Route::get('settings/notifications/templates', [TenantNotificationTemplateController::class, 'index'])->name('settings.notifications.templates.index');
Route::put('settings/notifications/templates/{event}/{locale}', [TenantNotificationTemplateController::class, 'update'])->name('settings.notifications.templates.update');
Route::get('settings/portal-surface', [PortalSurfaceController::class, 'show'])
    ->middleware('tenant.context')
    ->name('settings.portal-surface.show');
Route::put('settings/portal-surface', [PortalSurfaceController::class, 'update'])
    ->middleware('tenant.context')
    ->name('settings.portal-surface.update');
Route::get('whmcs/import', [WhmcsImportController::class, 'index'])
    ->middleware('tenant.context')
    ->name('whmcs.import.show');
Route::post('whmcs/import', [WhmcsImportController::class, 'store'])
    ->middleware('tenant.context')
    ->name('whmcs.import.store');
Route::get('support/overview', SupportOverviewController::class)->name('support.overview.show');
Route::get('ticket-statuses', [TicketStatusController::class, 'index'])->name('ticket-statuses.index');
Route::post('tickets/{ticket}/replies', [TicketReplyController::class, 'store'])
    ->middleware('throttle:ticket-reply')
    ->name('tickets.replies.store');
Route::apiResource('ticket-departments', TicketDepartmentController::class)->parameters([
    'ticket-departments' => 'ticketDepartment',
]);
Route::apiResource('tickets', TicketController::class)
    ->middlewareFor('store', 'throttle:ticket-create');
