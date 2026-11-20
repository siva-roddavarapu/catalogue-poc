import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailMessage, EmailSender } from '../../ports/EmailSender';

/** Sends via any SMTP server (Mailpit locally). Swapping provider = a new adapter, not new callers. */
export class SmtpEmailSender implements EmailSender {
  private readonly transporter: Transporter;

  constructor(options: { host: string; port: number }) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: false,
      // nodemailer defaults are 2 min / 30 s / 10 min: far too long for a user waiting on a form.
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail(message);
  }
}
