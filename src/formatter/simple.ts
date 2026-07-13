import { UNIT_EXP3 } from '../constants.js'
import { groups4 } from '../groups.js'

const KAN_DIGITS = '一二三四五六七八九'

export function simple(num: bigint): string {
  if (num === 0n) return '零'
  let ret = ''
  for (const [i4, unit4] of groups4(num)) {
    if (i4 === 0) continue
    if (i4 === 1) {
      ret += `一${unit4}`
      continue
    }
    for (let j: number = UNIT_EXP3.length; j >= 0; j--) {
      const unit3 = j === 0 ? '' : (UNIT_EXP3[j - 1] as string)
      const i3 = Math.floor(i4 / 10 ** j) % 10
      if (i3 === 0) continue
      ret += i3 === 1 && unit3 !== '' ? unit3 : (KAN_DIGITS[i3 - 1] as string) + unit3
    }
    ret += unit4
  }
  return ret
}
