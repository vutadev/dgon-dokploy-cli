import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Read version from package.json at runtime
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// In dev: src/lib/version.ts -> ../../package.json
// In dist: dist/index.js (bundled) -> handled by bundler
const require = createRequire(import.meta.url);

// Try to load package.json from project root
let pkg: { version: string };
try {
  pkg = require('../../package.json');
} catch {
  // Fallback for bundled builds
  pkg = { version: '0.2.4' };
}

export const VERSION = pkg.version;
