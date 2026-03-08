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
use App\Contracts\Repositories\Provisioning\ProvisioningJobRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServerGroupRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServerRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServiceRepositoryInterface;
use App\Contracts\Repositories\Support\SupportRepositoryInterface;
use App\Repositories\Auth\EloquentTenantRepository;
use App\Repositories\Auth\EloquentUserRepository;
use App\Repositories\Billing\EloquentInvoiceRepository;
use App\Repositories\Billing\EloquentPaymentRepository;
use App\Repositories\Catalog\EloquentProductGroupRepository;
use App\Repositories\Catalog\EloquentProductRepository;
use App\Repositories\Clients\EloquentClientRepository;
use App\Repositories\Orders\EloquentOrderRepository;
use App\Repositories\Provisioning\EloquentProvisioningJobRepository;
use App\Repositories\Provisioning\EloquentServerGroupRepository;
use App\Repositories\Provisioning\EloquentServerRepository;
use App\Repositories\Provisioning\EloquentServiceRepository;
use App\Repositories\Support\EloquentSupportRepository;
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
        $this->app->bind(ServerGroupRepositoryInterface::class, EloquentServerGroupRepository::class);
        $this->app->bind(ServerRepositoryInterface::class, EloquentServerRepository::class);
        $this->app->bind(ServiceRepositoryInterface::class, EloquentServiceRepository::class);
        $this->app->bind(ProvisioningJobRepositoryInterface::class, EloquentProvisioningJobRepository::class);
        $this->app->bind(SupportRepositoryInterface::class, EloquentSupportRepository::class);
    }
}
