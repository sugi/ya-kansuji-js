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

export function judicV(num: bigint): string {
  return judic(num, '〇', (s) => s.replace(/[0-9]/g, (d) => KAN_DIGITS.charAt(Number(d))))
}

export function judicH(num: bigint): string {
  return judic(num, '０', (s) =>
    s.replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0xfee0)),
  )
}
