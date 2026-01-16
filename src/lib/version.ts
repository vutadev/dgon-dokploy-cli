// Version injected at build time via: bun build --define:__VERSION__="x.x.x"
// In dev mode (bun run dev), __VERSION__ won't exist so we use fallback
declare const __VERSION__: string;

export const VERSION: string = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.0.0-dev';
