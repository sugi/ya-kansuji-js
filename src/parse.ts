import { NUM_ALT_CHARS, NUM_NORMALIZED_CHARS, UNIT_EXP3, UNIT_EXP4 } from './constants.js'

const altChars = Array.from(NUM_ALT_CHARS)
const normChars = Array.from(NUM_NORMALIZED_CHARS)
const NORMALIZE_MAP = new Map(altChars.map((c, i) => [c, normChars[i] as string]))

const SINGLE_UNITS = [...UNIT_EXP3, ...UNIT_EXP4.filter((u) => Array.from(u).length === 1)]
const MULTI_UNITS = UNIT_EXP4.filter((u) => Array.from(u).length > 1)
const CHAR_CLASS = [
  ...new Set([...altChars, ...normChars, ...SINGLE_UNITS, '卄', '廿', '卅', '丗', '卌', '皕']),
].join('')

const PART_SOURCE = `${MULTI_UNITS.join('|')}|[${CHAR_CLASS}]`
const KANSUJI_REGEXP = new RegExp(`(?:${PART_SOURCE})+`, 'u')
const PART_REGEXP = new RegExp(PART_SOURCE, 'gu')

const UNIT_EXP3_INDEX = new Map<string, number>(UNIT_EXP3.map((u, i) => [u, i]))
const UNIT_EXP4_INDEX = new Map<string, number>(UNIT_EXP4.map((u, i) => [u, i]))

function normalize(str: string): string {
  return Array.from(str, (c) => NORMALIZE_MAP.get(c) ?? c).join('')
}

export function toBigInt(str: string): bigint {
  const cleaned = normalize(String(str)).replace(/[,，、\s]/gu, '')
  const matched = KANSUJI_REGEXP.exec(cleaned)
  if (!matched) return 0n

  let ret3 = 0n
  let ret4 = 0n
  let curnum: bigint | null = null
  for (const c of matched[0]!.match(PART_REGEXP) ?? []) {
    if (c >= '1' && c <= '9') {
      curnum = (curnum ?? 0n) * 10n + BigInt(c)
    } else if (c === '0') {
      if (curnum !== null) curnum *= 10n
    } else if (c === '卄' || c === '廿') {
      ret3 += 20n
      curnum = null
    } else if (c === '卅' || c === '丗') {
      ret3 += 30n
      curnum = null
    } else if (c === '卌') {
      ret3 += 40n
      curnum = null
    } else if (c === '皕') {
      ret3 += 200n
      curnum = null
    } else if (UNIT_EXP4_INDEX.has(c)) {
      if (curnum !== null) {
        ret3 += curnum
        curnum = null
      }
      if (ret3 === 0n) ret3 = 1n
      ret4 += ret3 * 10n ** BigInt((UNIT_EXP4_INDEX.get(c)! + 1) * 4)
      ret3 = 0n
    } else if (UNIT_EXP3_INDEX.has(c)) {
      curnum ??= 1n
      ret3 += curnum * 10n ** BigInt(UNIT_EXP3_INDEX.get(c)! + 1)
      curnum = null
    }
  }
  if (curnum !== null) ret3 += curnum
  return ret4 + ret3
}

export function toNumber(str: string): number {
  const value = toBigInt(str)
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`kansuji value exceeds Number.MAX_SAFE_INTEGER: ${str}`)
  }
  return Number(value)
}
