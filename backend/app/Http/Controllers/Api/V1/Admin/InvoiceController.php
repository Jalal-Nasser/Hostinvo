<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\IndexInvoiceRequest;
use App\Http\Requests\Billing\StoreInvoiceRequest;
use App\Http\Requests\Billing\UpdateInvoiceRequest;
use App\Http\Resources\Billing\InvoiceResource;
use App\Models\Invoice;
use App\Services\Billing\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    public function index(IndexInvoiceRequest $request, InvoiceService $invoiceService): AnonymousResourceCollection
    {
        return InvoiceResource::collection(
            $invoiceService->paginate($request->validated())
        );
    }

    public function store(StoreInvoiceRequest $request, InvoiceService $invoiceService): JsonResponse
    {
        $invoice = $invoiceService->create($request->validated(), $request->user());

        return (new InvoiceResource($invoice))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Invoice $invoice, InvoiceService $invoiceService): InvoiceResource
    {
        $this->authorize('view', $invoice);

        return new InvoiceResource(
            $invoiceService->getForDisplay($invoice)
        );
    }

    public function update(
        UpdateInvoiceRequest $request,
        Invoice $invoice,
        InvoiceService $invoiceService
    ): InvoiceResource {
        return new InvoiceResource(
            $invoiceService->update($invoice, $request->validated(), $request->user())
        );
    }

    public function destroy(Invoice $invoice, InvoiceService $invoiceService): Response
    {
        $this->authorize('delete', $invoice);

        $invoiceService->delete($invoice);

        return response()->noContent();
    }
}
