import { describe, expect, it } from 'vitest'
import { judicH, judicV } from '../../src/index.js'
import {
  MAX_SUPPORTED,
  NINETY_FUKASHIGI,
  ONE_MURYOTAISU,
  REPEATED_ONES_72,
} from '../fixtures/large-numbers.js'

describe('judicV formatter', () => {
  it('converts number to judicial kanji style', () => {
    expect(judicV(0n)).toBe('〇')
    expect(judicV(1n)).toBe('一')
    expect(judicV(1234n)).toBe('一二三四')
    expect(judicV(10_003n)).toBe('一万〇〇〇三')
    expect(judicV(10_010_003n)).toBe('一〇〇一万〇〇〇三')
    expect(judicV(100_000_003n)).toBe('一億〇〇〇三')
    expect(judicV(200_000_000_056n)).toBe('二〇〇〇億〇〇五六')
    expect(judicV(9_030_000_001_008n)).toBe('九兆〇三〇〇億一〇〇八')
    expect(judicV(1_000_100_010_000n)).toBe('一兆〇〇〇一億〇〇〇一万')

    expect(judicV(9_999_999n)).toBe('九九九万九九九九')
    expect(judicV(NINETY_FUKASHIGI)).toBe('九〇不可思議')
    expect(judicV(ONE_MURYOTAISU)).toBe('一無量大数')
    expect(judicV(REPEATED_ONES_72)).toBe(
      '一一一一無量大数一一一一不可思議一一一一那由他一一一一阿僧祇一一一一恒河沙一一一一極一一一一載一一一一正一一一一澗一一一一溝一一一一穣一一一一𥝱一一一一垓一一一一京一一一一兆一一一一億一一一一万一一一一',
    )
    expect(judicV(MAX_SUPPORTED)).toBe(
      '九九九九無量大数九九九九不可思議九九九九那由他九九九九阿僧祇九九九九恒河沙九九九九極九九九九載九九九九正九九九九澗九九九九溝九九九九穣九九九九𥝱九九九九垓九九九九京九九九九兆九九九九億九九九九万九九九九',
    )
  })

  it('converts fractional values with positional notation (judic_v)', () => {
    expect(judicV({ int: 0n, frac: [5] })).toBe('〇・五')
    expect(judicV({ int: 123n, frac: [4, 5, 6] })).toBe('一二三・四五六')
    expect(judicV({ int: 1n, frac: [0, 5] })).toBe('一・〇五')
    expect(judicV({ int: 3n, frac: [1, 4, 1, 5, 9] })).toBe('三・一四一五九')
    expect(judicV({ int: 12_340_000n, frac: [5] })).toBe('一二三四万〇〇〇〇・五')
    expect(judicV({ int: 100_000_000n, frac: [5] })).toBe('一億〇〇〇〇・五')
  })
})

describe('judicH formatter', () => {
  it('converts number to judicial fullwidth style', () => {
    expect(judicH(0n)).toBe('０')
    expect(judicH(1n)).toBe('１')
    expect(judicH(1234n)).toBe('１２３４')
    expect(judicH(10_003n)).toBe('１万０００３')
    expect(judicH(10_010_003n)).toBe('１００１万０００３')
    expect(judicH(100_000_003n)).toBe('１億０００３')
    expect(judicH(200_000_000_056n)).toBe('２０００億００５６')
    expect(judicH(9_030_000_001_008n)).toBe('９兆０３００億１００８')
    expect(judicH(1_000_100_010_000n)).toBe('１兆０００１億０００１万')

    expect(judicH(9_999_999n)).toBe('９９９万９９９９')
    expect(judicH(NINETY_FUKASHIGI)).toBe('９０不可思議')
    expect(judicH(ONE_MURYOTAISU)).toBe('１無量大数')
    expect(judicH(REPEATED_ONES_72)).toBe(
      '１１１１無量大数１１１１不可思議１１１１那由他１１１１阿僧祇１１１１恒河沙１１１１極１１１１載１１１１正１１１１澗１１１１溝１１１１穣１１１１𥝱１１１１垓１１１１京１１１１兆１１１１億１１１１万１１１１',
    )
    expect(judicH(MAX_SUPPORTED)).toBe(
      '９９９９無量大数９９９９不可思議９９９９那由他９９９９阿僧祇９９９９恒河沙９９９９極９９９９載９９９９正９９９９澗９９９９溝９９９９穣９９９９𥝱９９９９垓９９９９京９９９９兆９９９９億９９９９万９９９９',
    )
  })

  it('converts fractional values with positional notation (judic_h)', () => {
    expect(judicH({ int: 0n, frac: [5] })).toBe('０．５')
    expect(judicH({ int: 123n, frac: [4, 5, 6] })).toBe('１２３．４５６')
    expect(judicH({ int: 1n, frac: [0, 5] })).toBe('１．０５')
    expect(judicH({ int: 12_340_000n, frac: [5] })).toBe('１２３４万００００．５')
  })
})
