import { randomUUID } from 'node:crypto';
import type { EnquiryAccepted, EnquiryRequest } from '@catalogue/shared';
import type { EmailSender } from '../ports/EmailSender';
import type { Logger } from '../ports/Logger';
import { EmailDeliveryError } from '../lib/errors';
import type { CatalogueService } from './catalogue.service';

export interface EnquiryDeps {
  catalogue: CatalogueService;
  email: EmailSender;
  salesInbox: string;
  from: string;
  /** Public web URL, used for the product link in the email. */
  webOrigin: string;
  logger: Logger;
}

// Control characters (except tab/newline) have no place in a plain-text email.
const stripControlChars = (value: string) =>
  // eslint-disable-next-line no-control-regex -- matching control characters is the point
  value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '');
const oneLine = (value: string) => stripControlChars(value).replace(/[\r\n]+/g, ' ');

/** AC5: turn a validated enquiry into an email to the sales inbox. */
export class EnquiryService {
  private readonly deps: EnquiryDeps;

  constructor(deps: EnquiryDeps) {
    this.deps = deps;
  }

  async submit(enquiry: EnquiryRequest): Promise<EnquiryAccepted> {
    // Re-fetch the product: title and price come from our source, never from the client.
    // Unknown product -> NotFoundError (404).
    const product = await this.deps.catalogue.getProduct(enquiry.productId);
    const id = randomUUID();
    const price = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency,
    }).format(product.price);

    const text = [
      `New enquiry ${id}`,
      '',
      `Product: ${product.title} (ID ${product.id})`,
      `Price:   ${price}`,
      `Link:    ${new URL(`/product/${product.id}`, this.deps.webOrigin).toString()}`,
      '',
      `Name:    ${oneLine(enquiry.name)}`,
      `Email:   ${enquiry.email}`,
      `Phone:   ${enquiry.phone ?? 'not given'}`,
      '',
      'Message:',
      enquiry.message ? stripControlChars(enquiry.message) : '(none)',
    ].join('\n');

    try {
      await this.deps.email.send({
        to: this.deps.salesInbox,
        from: this.deps.from,
        replyTo: { name: oneLine(enquiry.name), address: enquiry.email },
        subject: `New enquiry: ${oneLine(product.title)}`,
        text,
      });
    } catch (error) {
      throw new EmailDeliveryError(error);
    }

    this.deps.logger.info({ enquiryId: id, productId: product.id }, 'Enquiry emailed to sales');
    return { id };
  }
}
