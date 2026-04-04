<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\IndexPortalInvoiceRequest;
use App\Http\Resources\Billing\InvoiceResource;
use App\Models\Invoice;
use App\Services\Billing\InvoiceService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvoiceController extends Controller
{
    public function index(IndexPortalInvoiceRequest $request, InvoiceService $invoiceService): AnonymousResourceCollection
    {
        return InvoiceResource::collection(
            $invoiceService->paginateForPortal($request->user(), $request->validated())
        );
    }

    public function show(Invoice $invoice, InvoiceService $invoiceService): InvoiceResource
    {
        $this->authorize('viewPortal', $invoice);

        return new InvoiceResource(
            $invoiceService->getForPortalDisplay(request()->user(), $invoice) ?? $invoice
        );
    }
}
