<?php

namespace App\Providers;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Contracts\Repositories\Auth\UserRepositoryInterface;
use App\Contracts\Repositories\Catalog\ProductGroupRepositoryInterface;
use App\Contracts\Repositories\Catalog\ProductRepositoryInterface;
use App\Contracts\Repositories\Clients\ClientRepositoryInterface;
use App\Repositories\Auth\EloquentTenantRepository;
use App\Repositories\Auth\EloquentUserRepository;
use App\Repositories\Catalog\EloquentProductGroupRepository;
use App\Repositories\Catalog\EloquentProductRepository;
use App\Repositories\Clients\EloquentClientRepository;
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
    }
}
