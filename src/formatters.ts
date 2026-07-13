import { gov } from './formatter/gov.js'
import { judicH, judicV } from './formatter/judic.js'
import { lawyer } from './formatter/lawyer.js'
import { simple } from './formatter/simple.js'

export type KansujiFormatterOptions = Record<string, unknown>
export type KansujiFormatter = (num: bigint, options?: KansujiFormatterOptions) => string

const formatters = new Map<string, KansujiFormatter>([
  ['simple', simple],
  ['gov', gov],
  ['lawyer', lawyer],
  ['judic_v', judicV],
  ['judic_h', judicH],
])

export function registerFormatter(name: string, formatter: KansujiFormatter): void {
  if (typeof formatter !== 'function') {
    throw new TypeError('Registering invalid formatter.')
  }
  formatters.set(name, formatter)
}

export function getFormatter(name: string): KansujiFormatter | undefined {
  return formatters.get(name)
}

export function toKan(
  num: number | bigint,
  formatter: string | KansujiFormatter = 'simple',
  options: KansujiFormatterOptions = {},
): string {
  let value: bigint
  if (typeof num === 'bigint') {
    value = num
  } else if (Number.isSafeInteger(num)) {
    value = BigInt(num)
  } else {
    throw new RangeError(`toKan requires a safe integer or bigint: ${num}`)
  }
  if (value < 0n) throw new RangeError(`toKan does not support negative values: ${num}`)

  const fn = typeof formatter === 'function' ? formatter : formatters.get(formatter)
  if (!fn) throw new TypeError(`Unable to find formatter ${String(formatter)}`)
  return fn(value, options)
}
