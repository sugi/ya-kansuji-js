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

  it('rejects negative and non-integer input', () => {
    expect(() => toKan(-1)).toThrow(RangeError)
    expect(() => toKan(1.5)).toThrow(RangeError)
  })

  it('round-trips random integers through simple formatter', () => {
    for (let i = 0; i < 200; i++) {
      const digits = 1 + Math.floor(Math.random() * 20)
      let n = 0n
      for (let d = 0; d < digits; d++) n = n * 10n + BigInt(Math.floor(Math.random() * 10))
      expect(toBigInt(toKan(n))).toBe(n)
    }
  })
})
