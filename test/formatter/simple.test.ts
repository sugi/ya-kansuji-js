import { describe, expect, it } from 'vitest'
import { simple } from '../../src/index.js'

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
    expect(simple(10n ** 68n)).toBe('一無量大数')
  })
})
