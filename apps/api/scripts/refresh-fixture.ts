/**
 * Regenerates src/fixtures/products.json from the live source (already mapped to our shape).
 * Usage: npm run fixture:refresh -w apps/api   (reads FAKESTORE_BASE_URL from the repo .env)
 */
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { FakeStoreProductSource } from '../src/adapters/products/FakeStoreProductSource';

const envFile = path.resolve(import.meta.dirname, '../../../.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const baseUrl = process.env.FAKESTORE_BASE_URL;
if (!baseUrl) throw new Error('FAKESTORE_BASE_URL is not set (copy .env.example to .env).');

const products = await new FakeStoreProductSource({ baseUrl, cacheTtlMs: 0 }).listProducts();
const out = path.resolve(import.meta.dirname, '../src/fixtures/products.json');
writeFileSync(out, `${JSON.stringify(products, null, 2)}\n`);
console.log(`Wrote ${products.length} products to ${out}`);
