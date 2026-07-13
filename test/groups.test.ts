import { describe, expect, it } from 'vitest'
import { groups4 } from '../src/groups.js'
import { MAX_SUPPORTED } from './fixtures/large-numbers.js'

describe('groups4', () => {
  it('returns only the significant groups in most-significant-first order', () => {
    expect(groups4(0n)).toEqual([[0, '']])
    expect(groups4(1n)).toEqual([[1, '']])
    expect(groups4(10_001n)).toEqual([
      [1, '万'],
      [1, ''],
    ])
  })

  it('preserves zero groups between significant groups', () => {
    expect(groups4(1_000_000_000_003n)).toEqual([
      [1, '兆'],
      [0, '億'],
      [0, '万'],
      [3, ''],
    ])
  })

  it('supports every group through 無量大数', () => {
    const groups = groups4(MAX_SUPPORTED)

    expect(groups).toHaveLength(18)
    expect(groups[0]).toEqual([9999, '無量大数'])
    expect(groups.at(-1)).toEqual([9999, ''])
    expect(groups.every(([value]) => value === 9999)).toBe(true)
  })

  it('rejects negative and out-of-range input', () => {
    expect(() => groups4(-1n)).toThrow(RangeError)
    expect(() => groups4(10n ** 72n)).toThrow(RangeError)
    expect(() => groups4(10n ** 72n + 1n)).toThrow(RangeError)
  })
})
