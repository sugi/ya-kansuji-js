import { describe, expect, it } from 'vitest'
import { toBigInt, toNumber } from '../src/index.js'

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
    expect(toNumber('二万、五十')).toBe(20_050)
  })

  it('throws RangeError beyond MAX_SAFE_INTEGER for both signs', () => {
    expect(() => toNumber('一無量大数')).toThrow(RangeError)
    expect(() => toNumber('マイナス一無量大数')).toThrow(RangeError)
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

  it('negates via bigint when a leading マイナス is present', () => {
    expect(toBigInt('マイナス千二百三十四')).toBe(-1234n)
    expect(toBigInt('マイナス')).toBe(0n)
  })

  it('does not treat double quote as a numeric character', () => {
    expect(toBigInt('1"000')).toBe(1n)
    expect(toBigInt('一"二')).toBe(1n)
  })

  it('still matches the tail of the character class', () => {
    expect(toBigInt('丗')).toBe(30n)
  })
})
