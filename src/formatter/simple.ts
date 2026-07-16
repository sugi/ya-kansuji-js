import { KAN_DIGITS, UNIT_EXP3, UNIT_FRAC } from '../constants.js'
import { groups4 } from '../groups.js'
import { splitFraction, type KansujiValue } from '../value.js'

const POWERS_10 = [1, 10, 100, 1000] as const

/**
 * 標準的な漢数字へ整形する（位ごとに漢数字の単位を使う）。
 *
 * 小数部は分（10^-1）〜清浄（10^-21）の命数法で出力し、整数部があれば「・」で区切る。
 *
 * @param num 整数部が 0 以上 `10^72 − 1` 以下の値
 * @returns 漢数字文字列。`0n` は `'零'`
 * @throws {RangeError} 範囲外・負の値の場合。負数の整形には {@link toKan} を使う
 * @example
 * simple(12345n)                    // => '一万二千三百四十五'
 * simple(10003n)                    // => '一万三'
 * simple({ int: 1n, frac: [0, 5] }) // => '一・五厘'
 */
export function simple(num: KansujiValue): string {
  const [int, frac] = splitFraction(num)
  if (int === 0n && frac.length === 0) return '零'
  let ret = ''
  for (const [i4, unit4] of groups4(int)) {
    if (i4 === 0) continue
    for (let j: number = UNIT_EXP3.length; j >= 0; j--) {
      const unit3 = UNIT_EXP3[j - 1] ?? ''
      const i3 = Math.floor(i4 / (POWERS_10[j] ?? 1)) % 10
      if (i3 === 0) continue
      ret += i3 === 1 && unit3 !== '' ? unit3 : KAN_DIGITS.charAt(i3) + unit3
    }
    ret += unit4
  }
  if (frac.length > 0) {
    if (ret !== '') ret += '・'
    for (const [idx, d] of frac.entries()) {
      if (d !== 0) ret += KAN_DIGITS.charAt(d) + UNIT_FRAC[idx]
    }
  }
  return ret
}
