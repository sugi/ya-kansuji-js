import { KAN_DIGITS, UNIT_EXP3 } from '../constants.js'
import { groups4 } from '../groups.js'

const POWERS_10 = [1, 10, 100, 1000] as const

/**
 * 標準的な漢数字へ整形する（位ごとに漢数字の単位を使う）。
 *
 * @param num 0 以上 `10^72 − 1` 以下の bigint
 * @returns 漢数字文字列。`0n` は `'零'`
 * @throws {RangeError} 範囲外の値の場合。負数の整形には {@link toKan} を使う
 * @example
 * simple(12345n) // => '一万二千三百四十五'
 * simple(10003n) // => '一万三'
 */
export function simple(num: bigint): string {
  if (num === 0n) return '零'
  let ret = ''
  for (const [i4, unit4] of groups4(num)) {
    if (i4 === 0) continue
    for (let j: number = UNIT_EXP3.length; j >= 0; j--) {
      const unit3 = UNIT_EXP3[j - 1] ?? ''
      const i3 = Math.floor(i4 / (POWERS_10[j] ?? 1)) % 10
      if (i3 === 0) continue
      ret += i3 === 1 && unit3 !== '' ? unit3 : KAN_DIGITS.charAt(i3) + unit3
    }
    ret += unit4
  }
  return ret
}
