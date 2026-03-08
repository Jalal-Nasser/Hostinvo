<?php

return [
    'invoice_created'       => 'Invoice :reference has been created and is now due on :due_date.',
    'invoice_updated'       => 'Invoice :reference has been updated.',
    'invoice_paid'          => 'Invoice :reference has been paid. Amount: :amount.',
    'invoice_overdue'       => 'Invoice :reference is overdue. Please settle the balance of :amount at your earliest convenience.',
    'invoice_cancelled'     => 'Invoice :reference has been cancelled.',
    'payment_recorded'      => 'A payment of :amount has been recorded for invoice :reference.',
    'payment_failed'        => 'The payment for invoice :reference could not be completed.',
    'gateway_checkout_error' => 'Unable to initiate the payment gateway checkout for invoice :reference.',
    'refund_issued'         => 'A refund of :amount has been issued for invoice :reference.',
    'credit_applied'        => 'A credit of :amount has been applied to your account.',
];
