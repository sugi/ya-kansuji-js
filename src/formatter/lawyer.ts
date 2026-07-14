import { groups4 } from '../groups.js'

/**
 * 行政・司法で用いられる方式で整形する（4桁ごとにアラビア数字＋漢字単位、千の位にカンマ）。
 *
 * @param num 0 以上 `10^72 − 1` 以下の bigint
 * @returns 整形後の文字列。`0n` は `'0'`
 * @throws {RangeError} 範囲外の値の場合。負数の整形には {@link toKan} を使う
 * @example
 * lawyer(12340005n) // => '1,234万5'
 * lawyer(10003n)    // => '1万3'
 */
export function lawyer(num: bigint): string {
  if (num === 0n) return '0'
  let ret = ''
  for (const [i4, unit4] of groups4(num)) {
    if (i4 === 0) continue
    const s = String(i4)
    ret += (i4 >= 1000 ? `${s[0]},${s.slice(1)}` : s) + unit4
  }
  return ret
}
