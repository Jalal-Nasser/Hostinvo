<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TemplatedMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        private readonly string $subjectLine,
        private readonly string $bodyHtml,
        private readonly ?string $bodyText,
        private readonly string $templateLocale,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.templated',
            text: 'emails.templated-text',
            with: [
                'bodyHtml' => $this->bodyHtml,
                'bodyText' => $this->bodyText,
                'locale' => $this->templateLocale,
                'direction' => str_starts_with($this->templateLocale, 'ar') ? 'rtl' : 'ltr',
            ],
        );
    }
}
