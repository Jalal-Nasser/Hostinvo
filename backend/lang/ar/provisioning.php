<?php

return [
    'server_connection_tested' => 'اكتمل اختبار اتصال الخادم بنجاح.',
    'server_connection_retry_dispatched' => 'تمت إعادة جدولة مهمة التزويد من المحاولة الفاشلة.',
    'cpanel' => [
        'credentials_missing' => 'بيانات اعتماد خادم cPanel غير مكتملة. قم بتعيين اسم مستخدم WHM ورمز API أولاً.',
        'endpoint_missing' => 'نقطة اتصال خادم cPanel مفقودة.',
        'endpoint_invalid' => 'نقطة اتصال خادم cPanel غير صالحة.',
        'connection_successful' => 'اكتمل اختبار اتصال WHM بنجاح.',
        'connection_failed' => 'تعذر الاتصال بواجهة WHM البرمجية.',
        'request_failed' => 'فشلت عملية cPanel :operation.',
        'invalid_response' => 'أعادت واجهة cPanel البرمجية استجابة غير صالحة.',
        'package_mapping_required' => 'لا يوجد تعيين لحزمة cPanel لهذه الخدمة داخل Hostinvo.',
        'domain_required' => 'يلزم وجود نطاق أساسي قبل إنشاء حساب cPanel.',
        'username_required' => 'تعذر تحديد اسم مستخدم cPanel لهذه الخدمة.',
        'account_missing' => 'تعذر العثور على حساب cPanel على الخادم المستهدف.',
        'account_created' => 'تم إنشاء حساب cPanel :username بنجاح.',
        'account_suspended' => 'تم تعليق حساب cPanel :username بنجاح.',
        'account_unsuspended' => 'تم إلغاء تعليق حساب cPanel :username بنجاح.',
        'account_terminated' => 'تم إنهاء حساب cPanel :username بنجاح.',
        'package_changed' => 'تم تغيير حزمة cPanel للحساب :username بنجاح.',
        'password_reset' => 'تمت إعادة تعيين كلمة مرور cPanel للحساب :username بنجاح.',
        'usage_synced' => 'تمت مزامنة بيانات الاستخدام للحساب :username بنجاح.',
        'status_synced' => 'تمت مزامنة حالة خدمة cPanel للحساب :username بنجاح.',
    ],
];
