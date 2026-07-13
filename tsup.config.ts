import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
  },
  {
    entry: { 'index.iife.min': 'src/index.ts' },
    format: ['iife'],
    globalName: 'YaKansuji',
    minify: true,
    clean: false,
    // tsup appends a `.global` infix to iife output by default (e.g.
    // index.iife.min.global.js); override back to a plain `.js` extension
    // to match the package.json exports/unpkg field.
    outExtension: () => ({ js: '.js' }),
    // esbuild's IIFE output declares `var YaKansuji = ...`, which stays
    // function-scoped (and invisible on globalThis) when the file is
    // loaded via CommonJS require() instead of a browser <script> tag.
    // Explicitly assign to globalThis so both loading styles work.
    footer: { js: 'globalThis.YaKansuji = YaKansuji;' },
  },
])
