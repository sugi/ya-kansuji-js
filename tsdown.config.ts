import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    // tsdown >=0.16 defaults ESM output to .mjs/.d.mts; force back to .js/.d.ts
    // to match the package.json exports map.
    outExtensions: (ctx) => ({
      js: ctx.format === 'cjs' ? '.cjs' : '.js',
      dts: ctx.format === 'cjs' ? '.d.cts' : '.d.ts',
    }),
  },
  {
    entry: { 'index.iife.min': 'src/index.ts' },
    format: ['iife'],
    globalName: 'YaKansuji',
    minify: true,
    dts: false,
    clean: false,
    // tsdown appends a `.iife` format suffix by default; entryFileNames
    // pins the exact filename instead.
    outputOptions: {
      entryFileNames: '[name].js',
    },
  },
])
