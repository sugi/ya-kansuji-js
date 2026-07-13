import { describe, expect, it } from 'vitest'
import {
  getFormatter,
  type KansujiFormatter,
  registerFormatter,
  toBigInt,
  toKan,
} from '../src/index.js'

describe('toKan', () => {
  it('formats with the default simple formatter', () => {
    expect(toKan(1234)).toBe('千二百三十四')
    expect(toKan(1234n)).toBe('千二百三十四')
  })

  it('accepts a formatter function directly', () => {
    expect(toKan(5, (n) => `<${n}>`)).toBe('<5>')
  })

  it('runs registered custom formatters', () => {
    registerFormatter('hoge', (n) => (n === 1n ? 'いち' : 'たくさん'))
    expect(toKan(1, 'hoge')).toBe('いち')
    expect(toKan(4, 'hoge')).toBe('たくさん')
    expect(getFormatter('hoge')).toBeDefined()
  })

  it('throws on unknown formatter names', () => {
    expect(() => toKan(1, 'no_such_formatter')).toThrow(TypeError)
  })

  it('rejects registering a non-callable formatter', () => {
    expect(() => registerFormatter('t', true as unknown as KansujiFormatter)).toThrow(TypeError)
    expect(() => registerFormatter('one', 1 as unknown as KansujiFormatter)).toThrow(TypeError)
    expect(() => registerFormatter('str', 'hoge' as unknown as KansujiFormatter)).toThrow(
      TypeError,
    )
  })

  it('rejects non-integer number input', () => {
    // Ruby は Float#to_i で暗黙に切り捨てて処理を通す (to_kan(1.5) => "一", to_kan(-0.5) => "零") が、
    // JS 版は安全整数でない number を RangeError にする既存の非互換を維持する。
    expect(() => toKan(1.5)).toThrow(RangeError)
    expect(() => toKan(-0.5)).toThrow(RangeError)
  })

  it('formats negative numbers with a leading マイナス', () => {
    expect(toKan(-1234)).toBe('マイナス千二百三十四')
    expect(toKan(-1234n)).toBe('マイナス千二百三十四')
    expect(toKan(-10003, 'gov')).toBe('マイナス1万, 3')
  })

  it('passes only the absolute value to the formatter; toKan prepends the sign', () => {
    registerFormatter('absCheck', (n) => String(n))
    expect(toKan(-42, 'absCheck')).toBe('マイナス42')
  })

  it('round-trips a negative number through every builtin formatter', () => {
    for (const fmt of ['simple', 'gov', 'lawyer', 'judic_v', 'judic_h']) {
      expect(toBigInt(toKan(-98_765, fmt))).toBe(-98_765n)
    }
  })

  it('round-trips random integers (both signs) through simple formatter', () => {
    for (let i = 0; i < 200; i++) {
      const digits = 1 + Math.floor(Math.random() * 20)
      let n = 0n
      for (let d = 0; d < digits; d++) n = n * 10n + BigInt(Math.floor(Math.random() * 10))
      if (Math.random() < 0.5) n = -n
      expect(toBigInt(toKan(n))).toBe(n)
    }
  })
})
