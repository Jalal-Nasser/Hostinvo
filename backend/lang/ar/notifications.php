<?php

return [
    'invoice_created' => [
        'subject' => 'فاتورة جديدة :reference من :tenant',
        'greeting' => 'مرحبًا :name،',
        'body'     => 'تم إنشاء فاتورة جديدة برقم :reference لحسابك. المبلغ الإجمالي المستحق هو :amount وتاريخ الاستحقاق هو :due_date.',
        'cta'      => 'عرض الفاتورة',
        'footer'   => 'هذه رسالة تلقائية من :tenant.',
    ],

    'invoice_overdue' => [
        'subject' => 'الفاتورة :reference متأخرة السداد — :tenant',
        'greeting' => 'مرحبًا :name،',
        'body'     => 'الفاتورة :reference بمبلغ :amount متأخرة السداد منذ :due_date. يرجى ترتيب الدفع في أقرب وقت ممكن لتجنب انقطاع الخدمة.',
        'cta'      => 'ادفع الآن',
        'footer'   => 'هذه رسالة تلقائية من :tenant.',
    ],

    'payment_received' => [
        'subject' => 'تم استلام الدفع للفاتورة :reference — :tenant',
        'greeting' => 'مرحبًا :name،',
        'body'     => 'تم استلام دفعتك بمبلغ :amount للفاتورة :reference بنجاح. شكرًا لك على سرعة الدفع.',
        'cta'      => 'عرض الفاتورة',
        'footer'   => 'هذه رسالة تلقائية من :tenant.',
    ],

    'ticket_reply' => [
        'subject' => 'رد جديد على التذكرة #:number — :tenant',
        'greeting' => 'مرحبًا :name،',
        'body'     => 'تم إضافة رد جديد على تذكرة الدعم #:number بعنوان ":subject". يرجى تسجيل الدخول لمراجعة الرد والرد عليه إن لزم الأمر.',
        'cta'      => 'عرض التذكرة',
        'footer'   => 'هذه رسالة تلقائية من :tenant.',
    ],

    'provisioning_failed' => [
        'subject' => 'فشل التزويد للخدمة :reference — :tenant',
        'greeting' => 'مرحبًا :name،',
        'body'     => 'فشلت وظيفة التزويد للخدمة :reference. العملية: :operation. يرجى مراجعة سجلات التزويد وإعادة محاولة الوظيفة.',
        'cta'      => 'عرض الخدمة',
        'footer'   => 'هذه رسالة تلقائية من :tenant.',
    ],
];
