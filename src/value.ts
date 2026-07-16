import { UNIT_FRAC } from './constants.js'
import { assertMaxInputLength, MAX_INPUT_LENGTH } from './parse.js'

const FRAC_DIGITS = UNIT_FRAC.length
const FRAC_BASE = 10n ** BigInt(FRAC_DIGITS)
const NO_FRACTION: readonly number[] = Object.freeze([])

/**
 * 小数を含む正規化済みの値。`int` が整数部、`frac` が小数第1位からの数字列。
 * `frac` の末尾ゼロは取り除かれ、必ず 1 桁以上の非ゼロ桁を含む（小数部が空になる値は
 * 正規化の時点で bigint になる）。
 */
export interface KansujiFraction {
  readonly int: bigint
  readonly frac: readonly number[]
}

/** フォーマッタが受け取る正規化済みの値。整数は bigint、小数を含む値は {@link KansujiFraction}。 */
export type KansujiValue = bigint | KansujiFraction

interface NormalizedValue {
  negative: boolean
  value: KansujiValue
}

const DECIMAL_REGEXP = /^(-)?(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/

// 10進文字列を符号・整数部・小数桁 (10^-21 で四捨五入済み) に正規化する。
// 巨大な指数で bigint を構築しないよう、小数点位置を先に検査する。
function normalizeDecimalString(str: string): NormalizedValue {
  const m = DECIMAL_REGEXP.exec(str)
  if (!m) throw new RangeError(`kansuji value must be a decimal number string: ${str}`)
  const negative = m[1] === '-'
  const digits = m[2]! + (m[3] ?? '')
  if (!/[1-9]/.test(digits)) return { negative: false, value: 0n }
  const exp = m[4] === undefined ? 0 : Number(m[4])
  const pointPos = m[2]!.length + exp
  if (pointPos > MAX_INPUT_LENGTH) {
    throw new RangeError(`decimal exponent out of supported range: ${str}`)
  }
  const scaledLen = pointPos + FRAC_DIGITS
  if (scaledLen < 0) return { negative: false, value: 0n }

  let scaled: bigint
  if (scaledLen >= digits.length) {
    scaled = BigInt(digits) * 10n ** BigInt(scaledLen - digits.length)
  } else {
    scaled = scaledLen === 0 ? 0n : BigInt(digits.slice(0, scaledLen))
    if (digits.charAt(scaledLen) >= '5') scaled += 1n
  }
  if (scaled === 0n) return { negative: false, value: 0n }

  const int = scaled / FRAC_BASE
  const fracScaled = scaled % FRAC_BASE
  if (fracScaled === 0n) return { negative, value: int }
  const fracChars = fracScaled.toString().padStart(FRAC_DIGITS, '0').replace(/0+$/, '')
  return { negative, value: { int, frac: Array.from(fracChars, Number) } }
}

// 入力を非負の KansujiValue と符号に正規化する。結果が 0 のとき negative は常に false。
export function normalizeValue(num: number | bigint | string): NormalizedValue {
  if (typeof num === 'bigint') {
    return num < 0n ? { negative: true, value: -num } : { negative: false, value: num }
  }
  if (typeof num === 'number') {
    if (!Number.isFinite(num)) {
      throw new RangeError(`kansuji value must be finite: ${num}`)
    }
    if (Number.isInteger(num)) {
      if (!Number.isSafeInteger(num)) {
        throw new RangeError(`kansuji value must be a safe integer, bigint, or decimal string: ${num}`)
      }
      return num < 0 ? { negative: true, value: BigInt(-num) } : { negative: false, value: BigInt(num) }
    }
    return normalizeDecimalString(String(num))
  }
  assertMaxInputLength(num)
  return normalizeDecimalString(num)
}

/**
 * 値を整数部と小数桁の列に分解する。
 *
 * フォーマッタ実装向けのヘルパ。{@link toKan} から渡された値（bigint または
 * {@link KansujiFraction}）のほか、number や 10 進文字列も直接受け付ける。
 * 小数桁は小数第 1 位（分）から順で、末尾ゼロは取り除かれる。第 22 位以下は
 * 四捨五入される。
 *
 * @param num 分解する値
 * @returns `[整数部, 小数桁の配列]`。整数なら小数桁は空配列
 * @throws {RangeError} 値が負の場合、または number・文字列・オブジェクトとして不正な場合
 * @example
 * splitFraction(123n)      // => [123n, []]
 * splitFraction('123.456') // => [123n, [4, 5, 6]]
 * splitFraction('1.05')    // => [1n, [0, 5]]
 */
export function splitFraction(
  num: number | bigint | string | KansujiFraction,
): readonly [bigint, readonly number[]] {
  if (typeof num === 'object' && num !== null) {
    if (typeof num.int !== 'bigint' || !Array.isArray(num.frac)) {
      throw new RangeError('splitFraction requires a KansujiFraction with a bigint int and an array frac')
    }
    if (num.int < 0n) throw new RangeError('Value must be non-negative')
    return [num.int, num.frac]
  }
  const { negative, value } = normalizeValue(num)
  if (negative) throw new RangeError('Value must be non-negative')
  return typeof value === 'bigint' ? [value, NO_FRACTION] : [value.int, value.frac]
}
