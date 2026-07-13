import { NUM_ALT_CHARS, NUM_NORMALIZED_CHARS, UNIT_EXP3, UNIT_EXP4 } from './constants.js'

const altChars = Array.from(NUM_ALT_CHARS)
const normChars = Array.from(NUM_NORMALIZED_CHARS)
const NORMALIZE_MAP = new Map(altChars.map((c, i) => [c, normChars[i] as string]))
const SEPARATORS = new Set([
  ',', '，', '、',
  '\u0009', '\u000A', '\u000B', '\u000C', '\u000D', '\u0020', '\u00A0', '\u1680',
  '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006', '\u2007',
  '\u2008', '\u2009', '\u200A', '\u2028', '\u2029', '\u202F', '\u205F', '\u3000',
  '\uFEFF',
])
const DIGIT_VALUES = [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n] as const
const SPECIAL_NUMBER_VALUES = new Map<string, bigint>([
  ['卄', 20n],
  ['廿', 20n],
  ['卅', 30n],
  ['丗', 30n],
  ['卌', 40n],
  ['皕', 200n],
])

const SINGLE_UNITS = [...UNIT_EXP3, ...UNIT_EXP4.filter((u) => Array.from(u).length === 1)]
const MULTI_UNITS = UNIT_EXP4.filter((u) => Array.from(u).length > 1)
const CHAR_CLASS = [
  ...new Set([...altChars, ...normChars, ...SINGLE_UNITS, ...SPECIAL_NUMBER_VALUES.keys()]),
].join('')

const PART_SOURCE = `${MULTI_UNITS.join('|')}|[${CHAR_CLASS}]`
const KANSUJI_REGEXP = new RegExp(`(?:マイナス)?(?:${PART_SOURCE})+`, 'u')
const PART_REGEXP = new RegExp(PART_SOURCE, 'gu')

function createUnitValues(units: readonly string[], base: bigint): Map<string, bigint> {
  let value = base
  return new Map(units.map((unit) => {
    const entry: [string, bigint] = [unit, value]
    value *= base
    return entry
  }))
}

const UNIT_EXP3_VALUES = createUnitValues(UNIT_EXP3, 10n)
const UNIT_EXP4_VALUES = createUnitValues(UNIT_EXP4, 10_000n)
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)

function clean(str: string): string {
  let result = ''
  for (const c of str) {
    const normalized = NORMALIZE_MAP.get(c) ?? c
    if (!SEPARATORS.has(normalized)) result += normalized
  }
  return result
}

export function toBigInt(str: string): bigint {
  const cleaned = clean(String(str))
  const matched = KANSUJI_REGEXP.exec(cleaned)
  if (!matched) return 0n
  const matchedText = matched[0]
  if (matchedText === undefined) return 0n

  let ret3 = 0n
  let ret4 = 0n
  let curnum: bigint | null = null
  for (const c of matchedText.match(PART_REGEXP) ?? []) {
    if (c >= '1' && c <= '9') {
      const digit = DIGIT_VALUES[c.charCodeAt(0) - 48]!
      curnum = (curnum ?? 0n) * 10n + digit
    } else if (c === '0') {
      if (curnum !== null) curnum *= 10n
    } else {
      const specialNumber = SPECIAL_NUMBER_VALUES.get(c)
      if (specialNumber !== undefined) {
        ret3 += specialNumber
        curnum = null
      } else {
        const unit4 = UNIT_EXP4_VALUES.get(c)
        if (unit4 !== undefined) {
          if (curnum !== null) {
            ret3 += curnum
            curnum = null
          }
          if (ret3 === 0n) ret3 = 1n
          ret4 += ret3 * unit4
          ret3 = 0n
        } else {
          const unit3 = UNIT_EXP3_VALUES.get(c)
          if (unit3 !== undefined) {
            curnum ??= 1n
            ret3 += curnum * unit3
            curnum = null
          }
        }
      }
    }
  }
  if (curnum !== null) ret3 += curnum
  const ret = ret4 + ret3
  return matchedText.startsWith('マイナス') ? -ret : ret
}

export function toNumber(str: string): number {
  const value = toBigInt(str)
  if (value > MAX_SAFE_BIGINT || value < -MAX_SAFE_BIGINT) {
    throw new RangeError(`kansuji value exceeds Number.MAX_SAFE_INTEGER: ${str}`)
  }
  return Number(value)
}
