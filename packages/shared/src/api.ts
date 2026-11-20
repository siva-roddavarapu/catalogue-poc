/** Every API error response has this one shape (SPEC §2). */
export type ErrorCode =
  'VALIDATION_ERROR' | 'NOT_FOUND' | 'UPSTREAM_ERROR' | 'RATE_LIMITED' | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  status: 'ok';
}
