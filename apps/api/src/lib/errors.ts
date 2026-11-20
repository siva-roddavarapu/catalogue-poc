import type { ErrorCode } from '@catalogue/shared';

/** An error that is safe to show the client. Anything else becomes a generic 500. */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

/** The product data source failed. The cause is logged; the client gets a safe message. */
export class UpstreamError extends AppError {
  constructor(cause: unknown) {
    super(502, 'UPSTREAM_ERROR', 'The product catalogue is temporarily unavailable.');
    this.cause = cause;
  }
}

/** The email provider failed. The user can retry; their input is kept by the UI. */
export class EmailDeliveryError extends AppError {
  constructor(cause: unknown) {
    super(502, 'UPSTREAM_ERROR', "We couldn't send your enquiry right now. Please try again.");
    this.cause = cause;
  }
}
