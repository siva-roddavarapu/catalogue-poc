/** The slice of a logger that services need (pino-compatible). Keeps services free of Fastify. */
export interface Logger {
  info(details: object, message: string): void;
  warn(details: object, message: string): void;
}
