import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { type AppLocale } from "@/i18n/routing";
import { localePath } from "@/lib/auth";
import { fetchTicketFromCookies } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function PortalTicketDetailsPage({
  params,
}: Readonly<{
  params: { locale: string; ticketId: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Support");
  const ticket = await fetchTicketFromCookies(cookies().toString(), params.ticketId, "client");

  if (!ticket) {
    notFound();
  }

  return (
    <PortalShell
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            href={localePath(params.locale, "/portal/tickets/new")}
          >
            {t("newTicketButton")}
          </Link>
          <Link
            className="rounded-full border border-line bg-[#faf9f5]/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accentSoft"
            href={localePath(params.locale, "/portal/tickets")}
          >
            {t("backToTicketsButton")}
          </Link>
        </div>
      }
      currentPath={`/portal/tickets/${ticket.id}`}
      description={t("detailsDescription")}
      locale={params.locale as AppLocale}
      title={ticket.ticket_number}
    >
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-card p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("subjectLabel")}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{ticket.subject}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("statusLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{ticket.status?.name ?? t("notAvailable")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("priorityLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t(`priority${ticket.priority.charAt(0).toUpperCase()}${ticket.priority.slice(1)}`)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("departmentLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {ticket.department?.name ?? t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("sourceLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {ticket.source === "admin" ? t("sourceAdmin") : t("sourcePortal")}
              </p>
            </div>
          </div>
        </article>

        <aside className="glass-card p-6 md:p-8">
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("createdAtLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {ticket.created_at
                  ? new Intl.DateTimeFormat(params.locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(ticket.created_at))
                  : t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("lastReplyLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {ticket.last_reply_at
                  ? new Intl.DateTimeFormat(params.locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(ticket.last_reply_at))
                  : t("notAvailable")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{t("contactLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {ticket.client_contact
                  ? `${ticket.client_contact.first_name} ${ticket.client_contact.last_name}`
                  : t("notAvailable")}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">{t("conversationTitle")}</h2>
        {ticket.replies && ticket.replies.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {ticket.replies.map((reply) => (
              <article key={reply.id} className="rounded-[1.5rem] border border-line bg-[#faf9f5]/80 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {reply.user?.name ??
                        (reply.client_contact
                          ? `${reply.client_contact.first_name} ${reply.client_contact.last_name}`
                          : t("systemActor"))}
                    </p>
                    <span className="rounded-full border border-line bg-accentSoft px-3 py-1 text-xs font-semibold text-foreground">
                      {reply.reply_type === "admin"
                        ? t("replyTypeAdmin")
                        : reply.reply_type === "client"
                          ? t("replyTypeClient")
                          : reply.reply_type === "internal_note"
                            ? t("replyTypeInternal")
                            : t("replyTypeSystem")}
                    </span>
                  </div>
                  <p className="text-sm text-muted">
                    {reply.created_at
                      ? new Intl.DateTimeFormat(params.locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(reply.created_at))
                      : t("notAvailable")}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-7 text-foreground whitespace-pre-wrap">{reply.message}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">{t("noReplies")}</p>
        )}
      </section>

      <TicketReplyForm mode="client" statuses={[]} ticket={ticket} />
    </PortalShell>
  );
}

