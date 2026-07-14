import { KAN_DIGITS } from '../constants.js'
import { groups4 } from '../groups.js'

function judic(num: bigint, zero: string, mapDigits: (s: string) => string): string {
  if (num === 0n) return zero
  let ret = ''
  let head = true
  for (const [i4, unit4] of groups4(num)) {
    if (i4 === 0) continue
    ret += (head ? String(i4) : String(i4).padStart(4, '0')) + unit4
    head = false
  }
  return mapDigits(ret)
}

/**
 * 裁判判例の縦書き方式で整形する（4桁ごとに漢数字、下位グループはゼロ埋め、単位は漢字）。
 *
 * @param num 0 以上 `10^72 − 1` 以下の bigint
 * @returns 整形後の文字列。`0n` は `'〇'`
 * @throws {RangeError} 範囲外の値の場合。負数の整形には {@link toKan} を使う
 * @example
 * judicV(12340005n) // => '一二三四万〇〇〇五'
 */
export function judicV(num: bigint): string {
  return judic(num, '〇', (s) => s.replace(/[0-9]/g, (d) => KAN_DIGITS.charAt(Number(d))))
}

/**
 * 最高裁判例の横書き方式で整形する（4桁ごとに全角数字、下位グループはゼロ埋め）。
 *
 * @param num 0 以上 `10^72 − 1` 以下の bigint
 * @returns 整形後の文字列。`0n` は `'０'`
 * @throws {RangeError} 範囲外の値の場合。負数の整形には {@link toKan} を使う
 * @example
 * judicH(12340005n) // => '１２３４万０００５'
 */
export function judicH(num: bigint): string {
  return judic(num, '０', (s) =>
    s.replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0xfee0)),
  )
}
