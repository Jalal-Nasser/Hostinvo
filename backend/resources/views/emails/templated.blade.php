@php
    $appName = config('app.name', 'Hostinvo');
    $marketingUrl = rtrim((string) config('app.marketing_url', config('app.frontend_url', '')), '/');
    $logoUrl = $marketingUrl !== '' ? $marketingUrl.'/hostinvo-logo.png' : null;
    $logoIsPublic = $logoUrl
        && !str_contains($logoUrl, 'localhost')
        && !str_contains($logoUrl, '127.0.0.1');

    $renderedBodyHtml = (string) $bodyHtml;

    // Promote the first CTA link into a button-style action for common
    // verification/login emails, then style any remaining links as inline links.
    $renderedBodyHtml = preg_replace(
        '/<a\s/i',
        '<a style="display:inline-block;padding:12px 20px;border-radius:12px;background:linear-gradient(135deg,#048DFE 0%,#036DEB 52%,#0054C5 100%);color:#ffffff !important;text-decoration:none;font-weight:700;" ',
        $renderedBodyHtml,
        1,
    ) ?? $renderedBodyHtml;
    $renderedBodyHtml = preg_replace(
        '/<a\s(?![^>]*style=)/i',
        '<a style="color:#036DEB;text-decoration:none;font-weight:600;" ',
        $renderedBodyHtml,
    ) ?? $renderedBodyHtml;
@endphp
<!DOCTYPE html>
<html lang="{{ $locale }}" dir="{{ $direction }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $appName }}</title>
</head>
<body style="margin:0;padding:24px;background:#eef5ff;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;border-collapse:collapse;">
                    <tr>
                        <td style="padding:0 0 18px;">
                            <div style="border-radius:22px;background:linear-gradient(135deg,#0b2a6f 0%,#0f4dcf 48%,#048dfe 100%);padding:28px 30px;color:#ffffff;box-shadow:0 18px 40px rgba(4,77,207,0.18);">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                    <tr>
                                        <td style="vertical-align:middle;">
                                            @if ($logoIsPublic)
                                                <img src="{{ $logoUrl }}" alt="{{ $appName }}" style="display:block;max-width:180px;height:auto;">
                                            @else
                                                <div style="display:inline-block;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,0.14);font-size:22px;font-weight:800;letter-spacing:0.02em;">
                                                    {{ $appName }}
                                                </div>
                                            @endif
                                            <div style="margin-top:14px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.72);">
                                                Workspace Notifications
                                            </div>
                                            <div style="margin-top:10px;font-size:24px;line-height:1.35;font-weight:700;">
                                                Secure account access and workspace updates
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div style="border:1px solid #dbe7f5;border-radius:22px;background:#ffffff;padding:34px 34px 28px;box-shadow:0 12px 28px rgba(15,23,42,0.06);">
                                <div style="font-size:15px;line-height:1.8;color:#334155;">
                                    {!! $renderedBodyHtml !!}
                                </div>
                                <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e5edf8;font-size:12px;line-height:1.8;color:#64748b;">
                                    You received this email because an account action was started for {{ $appName }}.
                                    @if (! $logoIsPublic)
                                        Logo images may not render in external inboxes while the app is using a localhost URL.
                                    @endif
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
