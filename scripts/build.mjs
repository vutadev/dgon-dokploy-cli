#!/usr/bin/env node
// Build script that injects version from package.json at build time
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const version = pkg.version;

console.log(`Building dokploy-cli v${version}...`);

// Bundle with bun
execSync('bun build src/index.ts --outdir dist --target node', { stdio: 'inherit' });

// Replace version placeholder in output
const distPath = './dist/index.js';
let code = readFileSync(distPath, 'utf8');
code = code.replace(/__INJECT_VERSION__/g, version);
writeFileSync(distPath, code);

console.log(`Build complete: v${version}`);
