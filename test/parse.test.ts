import { describe, expect, it } from 'vitest'
import { MAX_INPUT_LENGTH, toBigInt, toNumber } from '../src/index.js'

describe('toNumber', () => {
  it('converts kansuji to number', () => {
    expect(toNumber('千二百三十四')).toBe(1234)
    expect(toNumber('百卄')).toBe(120)
    expect(toNumber('一二三四')).toBe(1234)
    expect(toNumber('千皕卅肆')).toBe(1234)
    expect(toNumber('一〇〇〇五')).toBe(10_005)
    expect(toNumber('〇')).toBe(0)
    expect(toNumber('零')).toBe(0)
    expect(toNumber('元')).toBe(0)
    expect(toNumber('五万廿')).toBe(50_020)
    expect(toNumber('百七十八万二')).toBe(1_780_002)
    expect(toNumber('九億６千万卌一')).toBe(960_000_041)
    expect(toNumber('肆陸')).toBe(46)
    expect(toNumber('弐仟柒佰玖什')).toBe(2790)
    expect(toNumber('捌萬貳拾')).toBe(80_020)
    expect(toNumber('伍〇')).toBe(50)
    expect(toNumber('000023')).toBe(23)
    expect(toNumber('一千〇二十四')).toBe(1024)
    expect(toNumber('二百二十二万零三百零二')).toBe(2_220_302)
    expect(toNumber('六百〇八')).toBe(608)
    expect(toNumber('六百十')).toBe(610)
    expect(toNumber('千〇〇三億')).toBe(100_300_000_000)
    expect(toNumber('千〇十')).toBe(1010)
    expect(toNumber('何か千〇十とか1')).toBe(1010)
  })

  it('converts numbers with separators', () => {
    expect(toNumber('1,000億 5,432万')).toBe(100_054_320_000)
    expect(toNumber('12,345')).toBe(12_345)
    expect(toNumber('一，二')).toBe(12)
    expect(toNumber('二万、五十')).toBe(20_050)
  })

  it('removes the same whitespace characters as ECMAScript \\s', () => {
    const whitespaceCharacters = [
      '\u0009', '\u000A', '\u000B', '\u000C', '\u000D', '\u0020', '\u00A0', '\u1680',
      '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006', '\u2007',
      '\u2008', '\u2009', '\u200A', '\u2028', '\u2029', '\u202F', '\u205F', '\u3000',
      '\uFEFF',
    ]

    for (const whitespace of whitespaceCharacters) {
      expect(toBigInt(`一${whitespace}二`)).toBe(12n)
      expect(toBigInt(`マイナス${whitespace}五十`)).toBe(-50n)
    }
  })

  it('does not remove characters outside ECMAScript \\s', () => {
    expect(toBigInt('一\u0085二')).toBe(1n)
    expect(toBigInt('一\u200B二')).toBe(1n)
  })

  it('throws RangeError beyond MAX_SAFE_INTEGER for both signs', () => {
    expect(() => toNumber('一無量大数')).toThrow(RangeError)
    expect(() => toNumber('マイナス一無量大数')).toThrow(RangeError)
  })

  it('accepts Number.MAX_SAFE_INTEGER and rejects the next integer for both signs', () => {
    const maxSafeInteger = '9007199254740991'
    const beyondMaxSafeInteger = '9007199254740992'

    expect(toNumber(maxSafeInteger)).toBe(Number.MAX_SAFE_INTEGER)
    expect(toNumber(`マイナス${maxSafeInteger}`)).toBe(-Number.MAX_SAFE_INTEGER)
    expect(() => toNumber(beyondMaxSafeInteger)).toThrow(RangeError)
    expect(() => toNumber(`マイナス${beyondMaxSafeInteger}`)).toThrow(RangeError)
  })

  it('parses a leading マイナス as a negative sign', () => {
    expect(toNumber('マイナス千二百三十四')).toBe(-1234)
    expect(toNumber('マイナス12,345')).toBe(-12_345)
    expect(toNumber('マイナス 五十')).toBe(-50)
    expect(toNumber('マイナス〇')).toBe(0)
    expect(toNumber('マイナス思考で3日')).toBe(3)
    expect(toNumber('マイナス')).toBe(0)
    expect(toNumber('五マイナス三')).toBe(5)
  })

  it('does not treat ASCII/Unicode minus signs as negative markers', () => {
    expect(toNumber('2019-04')).toBe(2019)
    expect(toNumber('-123')).toBe(123)
    expect(toNumber('−123')).toBe(123)
  })
})

describe('toBigInt', () => {
  it('handles values beyond MAX_SAFE_INTEGER', () => {
    expect(toBigInt('一無量大数')).toBe(10n ** 68n)
    expect(toBigInt('千皕卅肆')).toBe(1234n)
    expect(toBigInt('無関係なテキスト')).toBe(0n)
  })

  it('handles the astral unit 𥝱 and its variant 秭', () => {
    expect(toBigInt('三𥝱')).toBe(3n * 10n ** 24n)
    expect(toBigInt('三秭')).toBe(3n * 10n ** 24n)
  })

  it('handles normalized digits and multi-character units', () => {
    expect(toBigInt('１萬貳拾')).toBe(10_020n)
    expect(toBigInt('二不可思議三')).toBe(2n * 10n ** 64n + 3n)
  })

  it('negates via bigint when a leading マイナス is present', () => {
    expect(toBigInt('マイナス千二百三十四')).toBe(-1234n)
    expect(toBigInt('マイナス')).toBe(0n)
  })

  it('does not treat double quote as a numeric character', () => {
    expect(toBigInt('1"000')).toBe(1n)
    expect(toBigInt('一"二')).toBe(1n)
  })

  it('keeps non-numeric characters when finding the first numeric run', () => {
    expect(toBigInt('abc一,二xyz三')).toBe(12n)
  })

  it('still matches the tail of the character class', () => {
    expect(toBigInt('丗')).toBe(30n)
  })
})

describe('input length guard', () => {
  it('exposes the cap as a public constant', () => {
    expect(MAX_INPUT_LENGTH).toBe(16384)
  })

  it('accepts input of exactly MAX_INPUT_LENGTH', () => {
    expect(() => toBigInt('一'.repeat(MAX_INPUT_LENGTH))).not.toThrow()
  })

  it('throws RangeError when input exceeds MAX_INPUT_LENGTH', () => {
    expect(() => toBigInt('一'.repeat(MAX_INPUT_LENGTH + 1))).toThrow(RangeError)
  })

  it('makes toNumber reject over-length input too', () => {
    expect(() => toNumber('1'.repeat(MAX_INPUT_LENGTH + 1))).toThrow(RangeError)
  })

  // Regression guard: without the cap, parsing 1,000,000 digits is ~100s (O(n^2)),
  // which would blow the per-test timeout. The guard rejects in O(1) before any
  // accumulation, so this completes in well under 1s.
  it('rejects a large adversarial digit run promptly', () => {
    expect(() => toBigInt('1'.repeat(1_000_000))).toThrow(RangeError)
  }, 1000)
})
