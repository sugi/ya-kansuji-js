import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

// npm test の pretest で生成した最新の dist を検証する。
// dist がなければ skip せず、各テストを失敗させる。
describe('dist artifacts', () => {
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

  it('re-exports MAX_INPUT_LENGTH from built artifacts', () => {
    const cjs = execFileSync('node', [
      '-e',
      "const k = require('./dist/index.cjs'); console.log(k.MAX_INPUT_LENGTH)",
    ]).toString().trim()
    expect(cjs).toBe('16384')

    const esm = execFileSync('node', [
      '-e',
      "import('./dist/index.js').then(k => console.log(k.MAX_INPUT_LENGTH))",
    ]).toString().trim()
    expect(esm).toBe('16384')
  })

  it('formats fractions and exposes fraction API via built artifacts', () => {
    const cjs = execFileSync('node', [
      '-e',
      "const k = require('./dist/index.cjs'); console.log(k.toKan(1.05), k.splitFraction('1.05').join('|'), k.UNIT_FRAC.length)",
    ]).toString().trim()
    expect(cjs).toBe('一・五厘 1|0,5 21')

    const esm = execFileSync('node', [
      '-e',
      "import('./dist/index.js').then(k => console.log(k.toKan('3.14159', 'judic_v')))",
    ]).toString().trim()
    expect(esm).toBe('三・一四一五九')
  })
})
