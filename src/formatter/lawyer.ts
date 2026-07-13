import { groups4 } from '../groups.js'

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
