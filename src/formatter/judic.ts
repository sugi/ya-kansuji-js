import { KAN_DIGITS } from '../constants.js'
import { groups4 } from '../groups.js'
import { splitFraction, type KansujiValue } from '../value.js'

function judic(
  num: KansujiValue,
  zero: string,
  sep: string,
  mapDigits: (s: string) => string,
): string {
  const [int, frac] = splitFraction(num)
  if (int === 0n && frac.length === 0) return zero
  let ret = ''
  let head = true
  const groups = groups4(int)
  for (const [idx, [i4, unit4]] of groups.entries()) {
    if (i4 === 0 && !(frac.length > 0 && idx === groups.length - 1)) continue
    ret += (head ? String(i4) : String(i4).padStart(4, '0')) + unit4
    head = false
  }
  if (frac.length > 0) ret += sep + frac.join('')
  return mapDigits(ret)
}

/**
 * 裁判判例の縦書き方式で整形する（4桁ごとに漢数字、下位グループはゼロ埋め、単位は漢字）。
 *
 * 小数部は「・」に続けて漢数字の位取りで出力する。小数部があるとき一の位のまとまりは
 * 0 でもゼロ埋めして出力する（`一二三四万〇〇〇〇・五`）。
 *
 * @param num 整数部が 0 以上 `10^72 − 1` 以下の値
 * @returns 整形後の文字列。`0n` は `'〇'`
 * @throws {RangeError} 範囲外・負の値の場合。負数の整形には {@link toKan} を使う
 * @example
 * judicV(12340005n)                    // => '一二三四万〇〇〇五'
 * judicV({ int: 3n, frac: [1, 4] })    // => '三・一四'
 */
export function judicV(num: KansujiValue): string {
  return judic(num, '〇', '・', (s) => s.replace(/[0-9]/g, (d) => KAN_DIGITS.charAt(Number(d))))
}

/**
 * 最高裁判例の横書き方式で整形する（4桁ごとに全角数字、下位グループはゼロ埋め）。
 *
 * 小数部は「．」に続けて全角数字で出力する。小数部があるとき一の位のまとまりは
 * 0 でもゼロ埋めして出力する（`１２３４万００００．５`）。
 *
 * @param num 整数部が 0 以上 `10^72 − 1` 以下の値
 * @returns 整形後の文字列。`0n` は `'０'`
 * @throws {RangeError} 範囲外・負の値の場合。負数の整形には {@link toKan} を使う
 * @example
 * judicH(12340005n)                    // => '１２３４万０００５'
 * judicH({ int: 1n, frac: [0, 5] })    // => '１．０５'
 */
export function judicH(num: KansujiValue): string {
  return judic(num, '０', '．', (s) =>
    s.replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0xfee0)),
  )
}
