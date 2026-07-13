import { describe, expect, it } from 'vitest'
import {
  gov,
  getFormatter,
  judicH,
  judicV,
  type KansujiFormatter,
  lawyer,
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
