import { describe, expect, it } from 'vitest'
import {
  gov,
  getFormatter,
  judicH,
  judicV,
  type KansujiFormatter,
  lawyer,
  MAX_INPUT_LENGTH,
  registerFormatter,
  simple,
  toBigInt,
  toKan,
} from '../src/index.js'
import { MAX_SUPPORTED } from './fixtures/large-numbers.js'

function createDeterministicRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

function randomBigInt(random: () => number, digits: number): bigint {
  let decimal = String(1 + Math.floor(random() * 9))
  for (let i = 1; i < digits; i++) decimal += Math.floor(random() * 10)
  return BigInt(decimal)
}

describe('toKan', () => {
  it('formats with the default simple formatter', () => {
    expect(toKan(1234)).toBe('千二百三十四')
    expect(toKan(1234n)).toBe('千二百三十四')
  })

  it('accepts a formatter function directly', () => {
    expect(toKan(5, (n) => `<${n}>`)).toBe('<5>')
  })

  it('allows custom formatters to handle values beyond the builtin unit range', () => {
    const value = 10n ** 72n
    expect(toKan(value, (n) => String(n))).toBe(String(value))
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

  it('formats fractional numbers', () => {
    expect(toKan(0.5)).toBe('五分')
    expect(toKan(1.05)).toBe('一・五厘')
    expect(toKan(123.456, 'gov')).toBe('123.456')
    expect(toKan('0.25', 'judic_h')).toBe('０．２５')
    expect(toKan('3.14159', 'judic_v')).toBe('三・一四一五九')
    expect(toKan(1.0)).toBe('一')
    expect(toKan(0.0)).toBe('零')
  })

  it('interprets floats by their shortest decimal representation', () => {
    expect(toKan(0.1)).toBe('一分')
    expect(toKan(0.1 + 0.2)).toBe('三分四弾指')
  })

  it('rounds fractions below 清浄 (10^-21)', () => {
    expect(toKan('1e-22')).toBe('零')
    expect(toKan('0.9999999999999999999999')).toBe('一')
  })

  it('formats negative fractions with a leading マイナス', () => {
    expect(toKan(-0.5)).toBe('マイナス五分')
    expect(toKan(-1.05, 'gov')).toBe('マイナス1.05')
    expect(toKan('-0.0')).toBe('零')
  })

  it('rejects NaN, Infinity, and unsafe integral numbers', () => {
    expect(() => toKan(Number.NaN)).toThrow(RangeError)
    expect(() => toKan(Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => toKan(1e21)).toThrow(RangeError)
  })

  it('rejects malformed or oversized decimal strings', () => {
    expect(() => toKan('abc')).toThrow(RangeError)
    expect(() => toKan('1.2.3')).toThrow(RangeError)
    expect(() => toKan('二万')).toThrow(RangeError)
    expect(() => toKan('1'.repeat(MAX_INPUT_LENGTH + 1))).toThrow(RangeError)
    expect(() => toKan('1e999999999')).toThrow(RangeError)
  })

  it('checks the builtin range against the integer part of fractional values', () => {
    expect(toKan(`${'9'.repeat(72)}.5`)).toMatch(/九・五分$/)
    expect(() => toKan(`1${'0'.repeat(72)}.5`)).toThrow(RangeError)
  })

  it('passes normalized values through to custom formatters', () => {
    const probe: KansujiFormatter = (n) =>
      typeof n === 'bigint' ? `int:${n}` : `frac:${n.int}/${n.frac.join('')}`
    expect(toKan(5, probe)).toBe('int:5')
    expect(toKan(0.5, probe)).toBe('frac:0/5')
    expect(toKan(-1.5, probe)).toBe('マイナスfrac:1/5')
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

  it('accepts the largest supported magnitude and rejects larger values', () => {
    expect(toBigInt(toKan(MAX_SUPPORTED))).toBe(MAX_SUPPORTED)
    expect(toBigInt(toKan(-MAX_SUPPORTED))).toBe(-MAX_SUPPORTED)
    expect(() => toKan(10n ** 72n)).toThrow(RangeError)
    expect(() => toKan(-(10n ** 72n))).toThrow(RangeError)
  })

  it('rejects negative input passed directly to builtin formatters', () => {
    for (const formatter of [simple, gov, lawyer, judicV, judicH]) {
      expect(() => formatter(-1n)).toThrow(RangeError)
    }
  })

  it('round-trips deterministic integers up to the 72-digit limit', () => {
    const random = createDeterministicRandom(0x5eed_1234)
    const boundaries = [
      10n ** 67n - 1n,
      10n ** 67n,
      10n ** 68n - 1n,
      10n ** 68n,
      MAX_SUPPORTED,
    ]

    for (const n of boundaries) {
      expect(toBigInt(toKan(n))).toBe(n)
      expect(toBigInt(toKan(-n))).toBe(-n)
    }

    for (let i = 0; i < 200; i++) {
      const digits = 1 + Math.floor(random() * 72)
      let n = randomBigInt(random, digits)
      if (random() < 0.5) n = -n
      expect(toBigInt(toKan(n))).toBe(n)
    }
  })
})
