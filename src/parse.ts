import { NUM_ALT_CHARS, NUM_NORMALIZED_CHARS, UNIT_EXP3, UNIT_EXP4 } from './constants.js'

const altChars = Array.from(NUM_ALT_CHARS)
const normChars = Array.from(NUM_NORMALIZED_CHARS)
const NORMALIZE_MAP = new Map(altChars.map((c, i) => [c, normChars[i] as string]))
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

const UNIT_EXP3_VALUES = new Map<string, bigint>(
  UNIT_EXP3.map((unit, index) => [unit, 10n ** BigInt(index + 1)]),
)
const UNIT_EXP4_VALUES = new Map<string, bigint>(
  UNIT_EXP4.map((unit, index) => [unit, 10n ** BigInt((index + 1) * 4)]),
)
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)

function normalize(str: string): string {
  return Array.from(str, (c) => NORMALIZE_MAP.get(c) ?? c).join('')
}

export function toBigInt(str: string): bigint {
  const cleaned = normalize(String(str)).replace(/[,，、\s]/gu, '')
  const matched = KANSUJI_REGEXP.exec(cleaned)
  if (!matched) return 0n
  const matchedText = matched[0]
  if (matchedText === undefined) return 0n

  let ret3 = 0n
  let ret4 = 0n
  let curnum: bigint | null = null
  for (const c of matchedText.match(PART_REGEXP) ?? []) {
    const specialNumber = SPECIAL_NUMBER_VALUES.get(c)
    const unit4 = UNIT_EXP4_VALUES.get(c)
    const unit3 = UNIT_EXP3_VALUES.get(c)
    if (c >= '1' && c <= '9') {
      curnum = (curnum ?? 0n) * 10n + BigInt(c)
    } else if (c === '0') {
      if (curnum !== null) curnum *= 10n
    } else if (specialNumber !== undefined) {
      ret3 += specialNumber
      curnum = null
    } else if (unit4 !== undefined) {
      if (curnum !== null) {
        ret3 += curnum
        curnum = null
      }
      if (ret3 === 0n) ret3 = 1n
      ret4 += ret3 * unit4
      ret3 = 0n
    } else if (unit3 !== undefined) {
      curnum ??= 1n
      ret3 += curnum * unit3
      curnum = null
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
