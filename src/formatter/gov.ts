import { groups4 } from '../groups.js'
import { splitFraction, type KansujiValue } from '../value.js'

/**
 * 「公用文作成の要領」方式で整形する（4桁ごとにアラビア数字＋漢字単位、読点区切り）。
 *
 * 小数部は `.` に続けてアラビア数字で出力する。小数部があるとき一の位のまとまりは
 * 0 でも省略しない（`1234万, 0.5`）。
 *
 * @param num 整数部が 0 以上 `10^72 − 1` 以下の値
 * @returns 整形後の文字列。`0n` は `'0'`
 * @throws {RangeError} 範囲外・負の値の場合。負数の整形には {@link toKan} を使う
 * @example
 * gov(12340005n)                          // => '1234万, 5'
 * gov({ int: 12_340_000n, frac: [5] })    // => '1234万, 0.5'
 */
export function gov(num: KansujiValue): string {
  const [int, frac] = splitFraction(num)
  const fracPart = frac.length === 0 ? '' : `.${frac.join('')}`
  if (int === 0n) return `0${fracPart}`
  const groups = groups4(int)
  const parts: string[] = []
  for (const [idx, [i4, unit4]] of groups.entries()) {
    if (i4 === 0 && !(fracPart !== '' && idx === groups.length - 1)) continue
    parts.push(`${i4}${unit4}`)
  }
  return parts.join(', ') + fracPart
}
