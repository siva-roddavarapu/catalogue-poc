import { existsSync } from 'node:fs';
import path from 'node:path';
import { buildApp, type AppDeps } from './app';
import { ConfigError, loadConfig } from './config';
import { createContainer } from './container';

// For `npm run dev`: load the repo-root .env if present. Real env vars win (Docker sets them).
const envFile = path.resolve(import.meta.dirname, '../../../.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

// Fail fast: bad env or a bad merchandising file stops the process with a readable message.
let deps: AppDeps;
try {
  deps = createContainer(loadConfig());
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

const app = buildApp(deps);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
}

await app.listen({ port: deps.config.PORT, host: '0.0.0.0' });
