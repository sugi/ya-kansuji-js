import { describe, expect, it } from 'vitest'
import { toKan, toNumber } from '../src/index.js'

describe('package', () => {
  it('exposes the core round-trip API', () => {
    expect(toNumber('一〇二四')).toBe(1024)
    expect(toKan(12345)).toBe('一万二千三百四十五')
  })
})
