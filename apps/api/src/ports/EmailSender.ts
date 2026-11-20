export interface EmailMessage {
  to: string;
  from: string;
  replyTo: { name: string; address: string };
  subject: string;
  /** Plain text only: no HTML, so customer input can't inject markup. */
  text: string;
}

/** Outbound email. Mailpit via SMTP locally; an SES adapter would implement the same port. */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
