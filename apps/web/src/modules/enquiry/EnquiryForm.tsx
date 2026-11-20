import { useState, type ChangeEvent, type FormEvent } from 'react';
import { validateEnquiry, type EnquiryField, type EnquiryFieldErrors } from '@catalogue/shared';
import { ApiClientError, apiClient } from '../../api/client';
import styles from './EnquiryPage.module.css';

type Values = Record<EnquiryField, string>;
const EMPTY: Values = { name: '', email: '', phone: '', message: '' };

/**
 * AC5 form. Validates with the shared schema before sending; the server re-validates and
 * its field errors are shown the same way. On failure the user's input is kept for a retry.
 */
export function EnquiryForm({ productId, onSent }: { productId: number; onSent: () => void }) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<EnquiryFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const result = validateEnquiry({ productId, ...values });
    if (!result.ok) {
      setFieldErrors(result.fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.submitEnquiry(result.data);
      onSent();
    } catch (error) {
      const apiError = error instanceof ApiClientError ? error : null;
      const serverFieldErrors = (apiError?.details as { fieldErrors?: EnquiryFieldErrors })
        ?.fieldErrors;
      if (apiError?.status === 400 && serverFieldErrors) setFieldErrors(serverFieldErrors);
      else setSubmitError(apiError?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /** Shared wiring for each input: value, change handler, and accessible error state. */
  function fieldProps(name: EnquiryField) {
    const hasError = Boolean(fieldErrors[name]);
    return {
      id: `enquiry-${name}`,
      name,
      className: styles.input,
      value: values[name],
      'aria-invalid': hasError || undefined,
      'aria-describedby': hasError ? `enquiry-${name}-error` : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValues((current) => ({ ...current, [name]: event.target.value }));
        setFieldErrors((current) => ({ ...current, [name]: undefined })); // clear once edited
      },
    };
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="enquiry-name" className={styles.label}>
          Name
        </label>
        <input {...fieldProps('name')} autoComplete="name" />
        <FieldError name="name" errors={fieldErrors} />
      </div>

      <div className={styles.field}>
        <label htmlFor="enquiry-email" className={styles.label}>
          Email
        </label>
        <input {...fieldProps('email')} type="email" autoComplete="email" />
        <FieldError name="email" errors={fieldErrors} />
      </div>

      <div className={styles.field}>
        <label htmlFor="enquiry-phone" className={styles.label}>
          Phone (optional)
        </label>
        <input {...fieldProps('phone')} type="tel" autoComplete="tel" />
        <FieldError name="phone" errors={fieldErrors} />
      </div>

      <div className={styles.field}>
        <label htmlFor="enquiry-message" className={styles.label}>
          Message (optional)
        </label>
        <textarea {...fieldProps('message')} rows={5} maxLength={1000} />
        <FieldError name="message" errors={fieldErrors} />
      </div>

      {submitError && (
        <p role="alert" className={styles.submitError}>
          {submitError}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting ? 'Sending…' : submitError ? 'Try again' : 'Send enquiry'}
      </button>
    </form>
  );
}

function FieldError({ name, errors }: { name: EnquiryField; errors: EnquiryFieldErrors }) {
  const message = errors[name]?.[0];
  if (!message) return null;
  return (
    <p id={`enquiry-${name}-error`} className={styles.fieldError}>
      {message}
    </p>
  );
}
