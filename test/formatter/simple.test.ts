import { describe, expect, it } from 'vitest'
import { simple } from '../../src/index.js'
import {
  MAX_SUPPORTED,
  NINETY_FUKASHIGI,
  ONE_MURYOTAISU,
  REPEATED_ONES_72,
} from '../fixtures/large-numbers.js'

describe('simple formatter', () => {
  it('converts number to kansuji', () => {
    expect(simple(0n)).toBe('零')
    expect(simple(1n)).toBe('一')
    expect(simple(1234n)).toBe('千二百三十四')
    expect(simple(10_003n)).toBe('一万三')
    expect(simple(10_010_003n)).toBe('千一万三')
    expect(simple(100_000_003n)).toBe('一億三')
    expect(simple(200_000_000_056n)).toBe('二千億五十六')
    expect(simple(9_030_000_001_008n)).toBe('九兆三百億千八')
    expect(simple(9_999_999n)).toBe('九百九十九万九千九百九十九')
    expect(simple(9n * 10n ** 68n)).toBe('九無量大数')
    expect(simple(ONE_MURYOTAISU)).toBe('一無量大数')
    expect(simple(NINETY_FUKASHIGI)).toBe('九十不可思議')
    expect(simple(REPEATED_ONES_72)).toBe(
      '千百十一無量大数千百十一不可思議千百十一那由他千百十一阿僧祇千百十一恒河沙千百十一極千百十一載千百十一正千百十一澗千百十一溝千百十一穣千百十一𥝱千百十一垓千百十一京千百十一兆千百十一億千百十一万千百十一',
    )
    expect(simple(MAX_SUPPORTED)).toBe(
      '九千九百九十九無量大数九千九百九十九不可思議九千九百九十九那由他九千九百九十九阿僧祇九千九百九十九恒河沙九千九百九十九極九千九百九十九載九千九百九十九正九千九百九十九澗九千九百九十九溝九千九百九十九穣九千九百九十九𥝱九千九百九十九垓九千九百九十九京九千九百九十九兆九千九百九十九億九千九百九十九万九千九百九十九',
    )
  })

  it('converts fractional values with small number units', () => {
    expect(simple({ int: 0n, frac: [5] })).toBe('五分')
    expect(simple({ int: 123n, frac: [4, 5, 6] })).toBe('百二十三・四分五厘六毛')
    expect(simple({ int: 1n, frac: [0, 5] })).toBe('一・五厘')
    expect(simple({ int: 3n, frac: [1, 4, 1, 5, 9] })).toBe('三・一分四厘一毛五糸九忽')
    expect(simple({ int: 12_340_000n, frac: [5] })).toBe('千二百三十四万・五分')
    expect(simple({ int: 100_000_000n, frac: [5] })).toBe('一億・五分')
    expect(
      simple({ int: 0n, frac: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1] }),
    ).toBe(
      '一分二厘三毛四糸五忽六微七繊八沙九塵一渺二漠三模糊四逡巡五須臾六瞬息七弾指八刹那九六徳一清浄',
    )
  })
})
