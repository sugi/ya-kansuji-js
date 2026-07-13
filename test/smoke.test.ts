import { describe, expect, it } from 'vitest'
import { VERSION } from '../src/index.js'

describe('package', () => {
  it('has a version number', () => {
    expect(VERSION).toBe('0.1.0')
  })
})
