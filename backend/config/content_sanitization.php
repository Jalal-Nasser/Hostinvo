<?php

return [
    'cache_path' => storage_path('app/htmlpurifier'),

    'profiles' => [
        'plain_text' => [
            'allowed_html' => '',
            'allowed_schemes' => [
                'http' => true,
                'https' => true,
                'mailto' => true,
            ],
        ],
        'template_html' => [
            'allowed_html' => implode(',', [
                'p',
                'br',
                'strong',
                'b',
                'em',
                'i',
                'u',
                'ul',
                'ol',
                'li',
                'blockquote',
                'code',
                'pre',
                'hr',
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'a[href|title|target|rel]',
            ]),
            'allowed_schemes' => [
                'http' => true,
                'https' => true,
                'mailto' => true,
            ],
        ],
    ],
];
