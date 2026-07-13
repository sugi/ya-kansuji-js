import { UNIT_EXP4 } from './constants.js'

// 4桁ごとのグループを上位から返す。ゼロのグループも含む (スキップは各フォーマッタの責務)。
export function groups4(num: bigint): Array<[number, string]> {
  const ret: Array<[number, string]> = []
  for (let i: number = UNIT_EXP4.length; i >= 0; i--) {
    const unit = i === 0 ? '' : (UNIT_EXP4[i - 1] as string)
    ret.push([Number((num / 10_000n ** BigInt(i)) % 10_000n), unit])
  }
  return ret
}
