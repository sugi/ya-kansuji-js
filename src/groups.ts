import { UNIT_EXP4 } from './constants.js'

const GROUP_BASE = 10_000n
const GROUP_UNITS = ['', ...UNIT_EXP4] as const
const GROUP_COUNT = GROUP_UNITS.length
const MAX_EXCLUSIVE = GROUP_BASE ** BigInt(GROUP_COUNT)
const MAX_DIGITS = GROUP_COUNT * 4

// 有効な最上位から4桁ごとのグループを返す。途中のゼログループも含む。
export function groups4(num: bigint): Array<[number, string]> {
  if (num < 0n || num >= MAX_EXCLUSIVE) {
    throw new RangeError(`Kansuji formatters require a bigint between 0 and 10^${MAX_DIGITS} - 1`)
  }

  const ret: Array<[number, string]> = []
  let value = num
  let unitIndex = 0
  do {
    const unit = GROUP_UNITS[unitIndex]
    if (unit === undefined) {
      throw new RangeError(
        `Kansuji formatters require a bigint between 0 and 10^${MAX_DIGITS} - 1`,
      )
    }
    ret.push([Number(value % GROUP_BASE), unit])
    value /= GROUP_BASE
    unitIndex++
  } while (value > 0n)

  return ret.reverse()
}
