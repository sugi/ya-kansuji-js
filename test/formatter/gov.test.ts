import { describe, expect, it } from 'vitest'
import { gov } from '../../src/index.js'
import {
  MAX_SUPPORTED,
  NINETY_FUKASHIGI,
  ONE_MURYOTAISU,
  REPEATED_ONES_72,
} from '../fixtures/large-numbers.js'

describe('gov formatter', () => {
  it('converts number to government style', () => {
    expect(gov(0n)).toBe('0')
    expect(gov(1n)).toBe('1')
    expect(gov(1234n)).toBe('1234')
    expect(gov(10_003n)).toBe('1万, 3')
    expect(gov(10_010_003n)).toBe('1001万, 3')
    expect(gov(100_000_003n)).toBe('1億, 3')
    expect(gov(200_000_000_056n)).toBe('2000億, 56')
    expect(gov(9_030_000_001_008n)).toBe('9兆, 300億, 1008')
    expect(gov(1_000_100_010_000n)).toBe('1兆, 1億, 1万')

    expect(gov(9_999_999n)).toBe('999万, 9999')
    expect(gov(NINETY_FUKASHIGI)).toBe('90不可思議')
    expect(gov(ONE_MURYOTAISU)).toBe('1無量大数')
    expect(gov(REPEATED_ONES_72)).toBe(
      '1111無量大数, 1111不可思議, 1111那由他, 1111阿僧祇, 1111恒河沙, 1111極, 1111載, 1111正, 1111澗, 1111溝, 1111穣, 1111𥝱, 1111垓, 1111京, 1111兆, 1111億, 1111万, 1111',
    )
    expect(gov(MAX_SUPPORTED)).toBe(
      '9999無量大数, 9999不可思議, 9999那由他, 9999阿僧祇, 9999恒河沙, 9999極, 9999載, 9999正, 9999澗, 9999溝, 9999穣, 9999𥝱, 9999垓, 9999京, 9999兆, 9999億, 9999万, 9999',
    )
  })

  it('converts fractional values with decimal point notation', () => {
    expect(gov({ int: 0n, frac: [5] })).toBe('0.5')
    expect(gov({ int: 123n, frac: [4, 5, 6] })).toBe('123.456')
    expect(gov({ int: 1n, frac: [0, 5] })).toBe('1.05')
    expect(gov({ int: 1n, frac: [5] })).toBe('1.5')
    expect(gov({ int: 12_340_000n, frac: [5] })).toBe('1234万, 0.5')
    expect(gov({ int: 10_001n, frac: [5] })).toBe('1万, 1.5')
    expect(gov({ int: 100_000_000n, frac: [5] })).toBe('1億, 0.5')
  })
})
