import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { MerchandisingProvider } from '../../ports/MerchandisingProvider';
import { ConfigError } from '../../config';

const uniqueIds = z
  .array(z.number().int().positive())
  .refine((ids) => new Set(ids).size === ids.length, 'must not contain duplicate IDs');

const merchandisingSchema = z.object({
  homeFeatured: uniqueIds.length(5, 'must contain exactly 5 product IDs'),
  categoryFeatured: z.record(z.string(), uniqueIds).default({}),
});

/**
 * Curation read from config/merchandising.json. The file is the "admin UI" for the PoC.
 * It is validated once at startup, so a bad file stops the app with a clear message.
 */
export class JsonFileMerchandising implements MerchandisingProvider {
  private readonly data: z.infer<typeof merchandisingSchema>;

  constructor(data: unknown) {
    const result = merchandisingSchema.safeParse(data);
    if (!result.success) {
      throw new ConfigError(`Invalid merchandising config:\n${z.prettifyError(result.error)}`);
    }
    this.data = result.data;
  }

  static fromFile(filePath: string): JsonFileMerchandising {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new ConfigError(`Cannot read merchandising config at ${filePath}: ${String(error)}`);
    }
    return new JsonFileMerchandising(raw);
  }

  async getHomeFeatured(): Promise<number[]> {
    return this.data.homeFeatured;
  }

  async getCategoryFeatured(categorySlug: string): Promise<number[]> {
    return this.data.categoryFeatured[categorySlug] ?? [];
  }
}
