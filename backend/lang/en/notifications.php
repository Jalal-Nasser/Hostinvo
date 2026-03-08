<?php

return [
    'invoice_created' => [
        'subject' => 'New invoice :reference from :tenant',
        'greeting' => 'Hello :name,',
        'body'     => 'A new invoice :reference has been created for your account. The total amount due is :amount and the due date is :due_date.',
        'cta'      => 'View Invoice',
        'footer'   => 'This is an automated message from :tenant.',
    ],

    'invoice_overdue' => [
        'subject' => 'Invoice :reference is overdue — :tenant',
        'greeting' => 'Hello :name,',
        'body'     => 'Invoice :reference for the amount of :amount is now overdue as of :due_date. Please arrange payment as soon as possible to avoid service interruption.',
        'cta'      => 'Pay Now',
        'footer'   => 'This is an automated message from :tenant.',
    ],

    'payment_received' => [
        'subject' => 'Payment received for invoice :reference — :tenant',
        'greeting' => 'Hello :name,',
        'body'     => 'We have successfully received your payment of :amount for invoice :reference. Thank you for your prompt payment.',
        'cta'      => 'View Invoice',
        'footer'   => 'This is an automated message from :tenant.',
    ],

    'ticket_reply' => [
        'subject' => 'New reply on ticket #:number — :tenant',
        'greeting' => 'Hello :name,',
        'body'     => 'A new reply has been added to your support ticket #:number titled ":subject". Please log in to review the reply and respond if necessary.',
        'cta'      => 'View Ticket',
        'footer'   => 'This is an automated message from :tenant.',
    ],

    'provisioning_failed' => [
        'subject' => 'Provisioning failed for service :reference — :tenant',
        'greeting' => 'Hello :name,',
        'body'     => 'The provisioning job for service :reference has failed. Operation: :operation. Please review the provisioning logs and retry the job.',
        'cta'      => 'View Service',
        'footer'   => 'This is an automated message from :tenant.',
    ],
];
