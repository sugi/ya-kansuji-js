import { groups4 } from '../groups.js'
import { splitFraction, type KansujiValue } from '../value.js'

/**
 * 行政・司法で用いられる方式で整形する（4桁ごとにアラビア数字＋漢字単位、千の位にカンマ）。
 *
 * 小数部は `.` に続けてアラビア数字で出力する。小数部があるとき一の位のまとまりは
 * 0 でも省略しない（`1,234万0.5`）。
 *
 * @param num 整数部が 0 以上 `10^72 − 1` 以下の値
 * @returns 整形後の文字列。`0n` は `'0'`
 * @throws {RangeError} 範囲外・負の値の場合。負数の整形には {@link toKan} を使う
 * @example
 * lawyer(12340005n)                       // => '1,234万5'
 * lawyer({ int: 12_345_678n, frac: [9] }) // => '1,234万5,678.9'
 */
export function lawyer(num: KansujiValue): string {
  const [int, frac] = splitFraction(num)
  const fracPart = frac.length === 0 ? '' : `.${frac.join('')}`
  if (int === 0n) return `0${fracPart}`
  let ret = ''
  const groups = groups4(int)
  for (const [idx, [i4, unit4]] of groups.entries()) {
    if (i4 === 0 && !(fracPart !== '' && idx === groups.length - 1)) continue
    const s = String(i4)
    ret += (i4 >= 1000 ? `${s[0]},${s.slice(1)}` : s) + unit4
  }
  return ret + fracPart
}
