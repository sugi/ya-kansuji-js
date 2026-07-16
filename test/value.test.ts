import { describe, expect, it } from 'vitest'
import { MAX_INPUT_LENGTH, splitFraction, UNIT_FRAC } from '../src/index.js'
import { normalizeValue } from '../src/value.js'

describe('UNIT_FRAC', () => {
  it('has 21 units from 分 to 清浄', () => {
    expect(UNIT_FRAC.length).toBe(21)
    expect(UNIT_FRAC[0]).toBe('分')
    expect(UNIT_FRAC[20]).toBe('清浄')
  })
})

describe('normalizeValue', () => {
  it('passes integers through as bigint', () => {
    expect(normalizeValue(123)).toEqual({ negative: false, value: 123n })
    expect(normalizeValue(-5)).toEqual({ negative: true, value: 5n })
    expect(normalizeValue(0)).toEqual({ negative: false, value: 0n })
    expect(normalizeValue(-42n)).toEqual({ negative: true, value: 42n })
  })

  it('converts non-integer numbers via their shortest decimal representation', () => {
    expect(normalizeValue(0.1)).toEqual({ negative: false, value: { int: 0n, frac: [1] } })
    expect(normalizeValue(1.5)).toEqual({ negative: false, value: { int: 1n, frac: [5] } })
    expect(normalizeValue(-1.5)).toEqual({ negative: true, value: { int: 1n, frac: [5] } })
    expect(normalizeValue(0.00001)).toEqual({
      negative: false,
      value: { int: 0n, frac: [0, 0, 0, 0, 1] },
    })
  })

  it('returns a plain bigint for integral values', () => {
    expect(normalizeValue(1.0)).toEqual({ negative: false, value: 1n })
    expect(normalizeValue('2.0')).toEqual({ negative: false, value: 2n })
    expect(normalizeValue('1.50')).toEqual({ negative: false, value: { int: 1n, frac: [5] } })
  })

  it('accepts decimal strings exactly', () => {
    expect(normalizeValue('3.14159')).toEqual({
      negative: false,
      value: { int: 3n, frac: [1, 4, 1, 5, 9] },
    })
    expect(normalizeValue('0.123456789012345678901')).toEqual({
      negative: false,
      value: { int: 0n, frac: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1] },
    })
  })

  it('accepts exponent notation', () => {
    expect(normalizeValue('1e20')).toEqual({ negative: false, value: 10n ** 20n })
    expect(normalizeValue('1e+21')).toEqual({ negative: false, value: 10n ** 21n })
    expect(normalizeValue('1.5e3')).toEqual({ negative: false, value: 1500n })
    expect(normalizeValue('123e-2')).toEqual({ negative: false, value: { int: 1n, frac: [2, 3] } })
    expect(normalizeValue('1e-7')).toEqual({
      negative: false,
      value: { int: 0n, frac: [0, 0, 0, 0, 0, 0, 1] },
    })
  })

  it('rounds at 21 digits, half away from zero', () => {
    expect(normalizeValue('0.9999999999999999999999')).toEqual({ negative: false, value: 1n })
    expect(normalizeValue('-0.9999999999999999999999')).toEqual({ negative: true, value: 1n })
    expect(normalizeValue('1e-22')).toEqual({ negative: false, value: 0n })
    expect(normalizeValue('5e-22')).toEqual({
      negative: false,
      value: { int: 0n, frac: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
    })
    expect(normalizeValue('0.0000000000000000000004999')).toEqual({ negative: false, value: 0n })
  })

  it('does not emit a sign for values that normalize to zero', () => {
    expect(normalizeValue('-0.0')).toEqual({ negative: false, value: 0n })
    expect(normalizeValue('-1e-22')).toEqual({ negative: false, value: 0n })
    expect(normalizeValue(-0)).toEqual({ negative: false, value: 0n })
  })

  it('keeps the safe-integer requirement for integral numbers', () => {
    expect(() => normalizeValue(2 ** 53)).toThrow(RangeError)
    expect(() => normalizeValue(1e21)).toThrow(RangeError)
  })

  it('rejects NaN and Infinity', () => {
    expect(() => normalizeValue(Number.NaN)).toThrow(RangeError)
    expect(() => normalizeValue(Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => normalizeValue(Number.NEGATIVE_INFINITY)).toThrow(RangeError)
  })

  it('rejects malformed decimal strings', () => {
    for (const s of ['abc', '1.2.3', '.5', '5.', '', ' 1', '1_000', '１.５', 'NaN', '0x10', '+1']) {
      expect(() => normalizeValue(s), s).toThrow(RangeError)
    }
  })

  it('caps decimal string input length', () => {
    expect(() => normalizeValue('1'.repeat(MAX_INPUT_LENGTH + 1))).toThrow(RangeError)
    expect(normalizeValue(`0.${'3'.repeat(MAX_INPUT_LENGTH - 2)}`).value).toEqual({
      int: 0n,
      frac: Array.from({ length: 21 }, () => 3),
    })
  })

  it('guards against huge exponents without building huge values', () => {
    expect(() => normalizeValue('1e999999999')).toThrow(RangeError)
    expect(normalizeValue('1e-999999999')).toEqual({ negative: false, value: 0n })
    expect(normalizeValue('0e999999999')).toEqual({ negative: false, value: 0n })
  })
})

describe('splitFraction', () => {
  it('returns the integer part and an empty fraction for integers', () => {
    expect(splitFraction(5)).toEqual([5n, []])
    expect(splitFraction(0n)).toEqual([0n, []])
    expect(splitFraction(2.0)).toEqual([2n, []])
  })

  it('splits fraction digits most significant first', () => {
    expect(splitFraction('123.456')).toEqual([123n, [4, 5, 6]])
    expect(splitFraction(0.25)).toEqual([0n, [2, 5]])
  })

  it('keeps inner zeros and strips trailing zeros', () => {
    expect(splitFraction('1.05')).toEqual([1n, [0, 5]])
    expect(splitFraction('1.50')).toEqual([1n, [5]])
  })

  it('handles all 21 digits down to 10^-21', () => {
    expect(splitFraction(`0.${'3'.repeat(21)}`)).toEqual([0n, Array.from({ length: 21 }, () => 3)])
  })

  it('passes normalized KansujiFraction values through', () => {
    expect(splitFraction({ int: 1n, frac: [0, 5] })).toEqual([1n, [0, 5]])
  })

  it('rejects negative values', () => {
    expect(() => splitFraction(-0.25)).toThrow(RangeError)
    expect(() => splitFraction('-1.5')).toThrow(RangeError)
    expect(() => splitFraction(-5)).toThrow(RangeError)
    expect(() => splitFraction(-5n)).toThrow(RangeError)
    expect(() => splitFraction({ int: -1n, frac: [5] })).toThrow(RangeError)
  })
})
