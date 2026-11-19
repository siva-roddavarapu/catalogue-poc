import type { AppDeps } from './app';
import type { Config } from './config';

/**
 * Composition root: the ONE place that decides which adapter implements each port,
 * based on validated config. Nothing else in the app constructs adapters.
 */
export function createContainer(config: Config): AppDeps {
  return { config };
}
