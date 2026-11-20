import type { EmailMessage, EmailSender } from '../../ports/EmailSender';

/** Test adapter: records messages instead of sending them. */
export class InMemoryEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }
}
