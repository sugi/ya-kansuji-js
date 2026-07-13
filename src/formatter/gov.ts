import { groups4 } from '../groups.js'

export function gov(num: bigint): string {
  if (num === 0n) return '0'
  const parts: string[] = []
  for (const [i4, unit4] of groups4(num)) {
    if (i4 === 0) continue
    parts.push(`${i4}${unit4}`)
  }
  return parts.join(', ')
}
