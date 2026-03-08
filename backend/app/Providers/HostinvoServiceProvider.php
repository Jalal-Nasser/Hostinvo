<?php

namespace App\Providers;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Contracts\Repositories\Auth\UserRepositoryInterface;
use App\Contracts\Repositories\Billing\InvoiceRepositoryInterface;
use App\Contracts\Repositories\Billing\PaymentRepositoryInterface;
use App\Contracts\Repositories\Catalog\ProductGroupRepositoryInterface;
use App\Contracts\Repositories\Catalog\ProductRepositoryInterface;
use App\Contracts\Repositories\Clients\ClientRepositoryInterface;
use App\Contracts\Repositories\Orders\OrderRepositoryInterface;
use App\Repositories\Auth\EloquentTenantRepository;
use App\Repositories\Auth\EloquentUserRepository;
use App\Repositories\Billing\EloquentInvoiceRepository;
use App\Repositories\Billing\EloquentPaymentRepository;
use App\Repositories\Catalog\EloquentProductGroupRepository;
use App\Repositories\Catalog\EloquentProductRepository;
use App\Repositories\Clients\EloquentClientRepository;
use App\Repositories\Orders\EloquentOrderRepository;
use App\Support\Tenancy\CurrentTenant;
use Illuminate\Support\ServiceProvider;

class HostinvoServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CurrentTenant::class, fn () => new CurrentTenant());
        $this->app->bind(TenantRepositoryInterface::class, EloquentTenantRepository::class);
        $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
        $this->app->bind(ProductGroupRepositoryInterface::class, EloquentProductGroupRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);
        $this->app->bind(ClientRepositoryInterface::class, EloquentClientRepository::class);
        $this->app->bind(OrderRepositoryInterface::class, EloquentOrderRepository::class);
        $this->app->bind(InvoiceRepositoryInterface::class, EloquentInvoiceRepository::class);
        $this->app->bind(PaymentRepositoryInterface::class, EloquentPaymentRepository::class);
    }
}
