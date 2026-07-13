import { UNIT_EXP4 } from './constants.js'

const GROUP_BASE = 10_000n
const GROUPS = ['', ...UNIT_EXP4]
  .map((unit, exponent) => [GROUP_BASE ** BigInt(exponent), unit] as const)
  .reverse()
const GROUP_COUNT = UNIT_EXP4.length + 1
const MAX_EXCLUSIVE = GROUP_BASE ** BigInt(GROUP_COUNT)
const MAX_DIGITS = GROUP_COUNT * 4

// 4桁ごとのグループを上位から返す。ゼロのグループも含む (スキップは各フォーマッタの責務)。
export function groups4(num: bigint): Array<[number, string]> {
  if (num < 0n || num >= MAX_EXCLUSIVE) {
    throw new RangeError(`Kansuji formatters require a bigint between 0 and 10^${MAX_DIGITS} - 1`)
  }

  const ret: Array<[number, string]> = []
  for (const [power, unit] of GROUPS) {
    ret.push([Number((num / power) % GROUP_BASE), unit])
  }
  return ret
}
