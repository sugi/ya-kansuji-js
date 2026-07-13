import { describe, expect, it } from 'vitest'
import { lawyer } from '../../src/index.js'
import {
  MAX_SUPPORTED,
  NINETY_FUKASHIGI,
  ONE_MURYOTAISU,
  REPEATED_ONES_72,
} from '../fixtures/large-numbers.js'

describe('lawyer formatter', () => {
  it('converts number to lawyer style', () => {
    expect(lawyer(0n)).toBe('0')
    expect(lawyer(1n)).toBe('1')
    expect(lawyer(1234n)).toBe('1,234')
    expect(lawyer(10_003n)).toBe('1万3')
    expect(lawyer(10_010_003n)).toBe('1,001万3')
    expect(lawyer(100_000_003n)).toBe('1億3')
    expect(lawyer(200_000_000_056n)).toBe('2,000億56')
    expect(lawyer(9_030_000_001_008n)).toBe('9兆300億1,008')

    expect(lawyer(9_999_999n)).toBe('999万9,999')
    expect(lawyer(NINETY_FUKASHIGI)).toBe('90不可思議')
    expect(lawyer(ONE_MURYOTAISU)).toBe('1無量大数')
    expect(lawyer(REPEATED_ONES_72)).toBe(
      '1,111無量大数1,111不可思議1,111那由他1,111阿僧祇1,111恒河沙1,111極1,111載1,111正1,111澗1,111溝1,111穣1,111𥝱1,111垓1,111京1,111兆1,111億1,111万1,111',
    )
    expect(lawyer(MAX_SUPPORTED)).toBe(
      '9,999無量大数9,999不可思議9,999那由他9,999阿僧祇9,999恒河沙9,999極9,999載9,999正9,999澗9,999溝9,999穣9,999𥝱9,999垓9,999京9,999兆9,999億9,999万9,999',
    )
  })
})
