import { z } from 'zod';

const noLineBreaks = (value: string) => !/[\r\n]/.test(value);

/** '' from an untouched optional form field means "not given". */
const optionalText = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

/**
 * AC5: the enquiry form. The SAME schema validates in the browser (fast feedback)
 * and on the server (authoritative). Product details are NOT taken from the client.
 */
export const enquirySchema = z.object({
  productId: z.number().int().positive(),
  name: z
    .string()
    .trim()
    .min(2, 'Enter your name (at least 2 characters)')
    .max(100, 'Name can be at most 100 characters')
    // The name goes into the Reply-To header: line breaks there enable header injection.
    .refine(noLineBreaks, 'Name must be on one line'),
  email: z.string().trim().pipe(z.email('Enter a valid email address').max(254)),
  phone: optionalText(
    z
      .string()
      .trim()
      .regex(/^[0-9 +()-]{7,20}$/, 'Phone: 7–20 digits, spaces or + ( ) -'),
  ),
  message: optionalText(z.string().trim().max(1000, 'Message can be at most 1000 characters')),
});

/** What the form sends (strings may be untrimmed or ''). */
export type EnquiryInput = z.input<typeof enquirySchema>;
/** What the server works with after validation. */
export type EnquiryRequest = z.output<typeof enquirySchema>;

export interface EnquiryAccepted {
  id: string;
}

export type EnquiryField = 'name' | 'email' | 'phone' | 'message';
export type EnquiryFieldErrors = Partial<Record<EnquiryField, string[]>>;

/** Browser-side check with per-field messages (the server re-validates with the same schema). */
export function validateEnquiry(
  input: EnquiryInput,
): { ok: true; data: EnquiryRequest } | { ok: false; fieldErrors: EnquiryFieldErrors } {
  const result = enquirySchema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, fieldErrors: z.flattenError(result.error).fieldErrors };
}
