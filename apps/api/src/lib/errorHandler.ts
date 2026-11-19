import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z, ZodError } from 'zod';
import type { ApiErrorBody, ErrorCode } from '@catalogue/shared';
import { AppError } from './errors';

function send(
  reply: FastifyReply,
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown,
) {
  const body: ApiErrorBody = {
    error: { code, message, ...(details !== undefined && { details }) },
  };
  return reply.status(status).send(body);
}

/**
 * Maps every thrown error to the single `{ error: { code, message, details? } }` shape.
 * Unknown errors are logged in full but the client only ever sees a generic message.
 */
export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) request.log.error(error);
    return send(reply, error.statusCode, error.code, error.message, error.details);
  }

  // Routes validate params/query/body with Zod; a failed parse is the client's fault.
  if (error instanceof ZodError) {
    return send(reply, 400, 'VALIDATION_ERROR', 'Invalid request', z.flattenError(error));
  }

  if (error.statusCode === 429) {
    return send(
      reply,
      429,
      'RATE_LIMITED',
      'Too many requests. Please wait a minute and try again.',
    );
  }

  // Fastify's own 4xx errors (malformed JSON, body too large, ...) have safe messages.
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return send(reply, error.statusCode, 'VALIDATION_ERROR', error.message);
  }

  request.log.error(error);
  return send(reply, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}
