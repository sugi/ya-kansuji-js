import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// ビルド済み dist を検証する。CI では build 後に実行される前提。
describe.skipIf(!existsSync('dist/index.cjs'))('dist artifacts', () => {
  it('works via CJS require', () => {
    const out = execFileSync('node', [
      '-e',
      "const k = require('./dist/index.cjs'); console.log(k.toKan(1234))",
    ]).toString().trim()
    expect(out).toBe('千二百三十四')
  })

  it('works via ESM import', () => {
    const out = execFileSync('node', [
      '-e',
      "import('./dist/index.js').then(k => console.log(k.toNumber('千二百三十四')))",
    ]).toString().trim()
    expect(out).toBe('1234')
  })

  it('exposes YaKansuji global via IIFE', () => {
    const out = execFileSync('node', [
      '-e',
      "require('./dist/index.iife.min.js'); console.log(globalThis.YaKansuji.toKan(1234))",
    ]).toString().trim()
    expect(out).toBe('千二百三十四')
  })
})
