import { groups4 } from '../groups.js'

/**
 * 「公用文作成の要領」方式で整形する（4桁ごとにアラビア数字＋漢字単位、読点区切り）。
 *
 * @param num 0 以上 `10^72 − 1` 以下の bigint
 * @returns 整形後の文字列。`0n` は `'0'`
 * @throws {RangeError} 範囲外の値の場合。負数の整形には {@link toKan} を使う
 * @example
 * gov(12340005n) // => '1234万, 5'
 * gov(10003n)    // => '1万, 3'
 */
export function gov(num: bigint): string {
  if (num === 0n) return '0'
  const parts: string[] = []
  for (const [i4, unit4] of groups4(num)) {
    if (i4 === 0) continue
    parts.push(`${i4}${unit4}`)
  }
  return parts.join(', ')
}
