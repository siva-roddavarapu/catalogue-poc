import { z } from 'zod';

const currencyCode = z
  .string()
  .regex(/^[A-Z]{3}$/, 'must be a 3-letter ISO 4217 code, e.g. USD')
  .refine((code) => {
    try {
      new Intl.NumberFormat('en', { style: 'currency', currency: code });
      return true;
    } catch {
      return false;
    }
  }, 'is not a currency Intl.NumberFormat recognises');

const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    WEB_ORIGIN: z.url().default('http://localhost:5173'),
    PRODUCT_SOURCE: z.enum(['fakestore', 'fixture']).default('fakestore'),
    // No default on purpose: the upstream URL lives in .env, not in code.
    FAKESTORE_BASE_URL: z.url().optional(),
    CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(300),
    CURRENCY: currencyCode.default('USD'),
    SMTP_HOST: z.string().min(1).default('localhost'),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
    SMTP_FROM: z.email(),
    SALES_INBOX: z.email(),
  })
  .refine((env) => env.PRODUCT_SOURCE !== 'fakestore' || env.FAKESTORE_BASE_URL, {
    message: 'is required when PRODUCT_SOURCE=fakestore',
    path: ['FAKESTORE_BASE_URL'],
  });

export type Config = z.infer<typeof envSchema>;

export class ConfigError extends Error {}

/** Parse and validate environment variables. Throws ConfigError listing every problem. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new ConfigError(`Invalid configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
