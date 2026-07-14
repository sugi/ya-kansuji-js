import { gov } from './formatter/gov.js'
import { judicH, judicV } from './formatter/judic.js'
import { lawyer } from './formatter/lawyer.js'
import { simple } from './formatter/simple.js'

/** フォーマッタに渡す任意のオプション。ビルトインフォーマッタは参照しない。 */
export type KansujiFormatterOptions = Record<string, unknown>

/**
 * 非負の bigint を文字列へ整形する関数。{@link toKan} は負数の符号処理を済ませたうえで
 * 常に 0 以上の値を渡す。
 */
export type KansujiFormatter = (num: bigint, options?: KansujiFormatterOptions) => string

const formatters = new Map<string, KansujiFormatter>([
  ['simple', simple],
  ['gov', gov],
  ['lawyer', lawyer],
  ['judic_v', judicV],
  ['judic_h', judicH],
])

/**
 * フォーマッタを名前付きで登録する。既存の同名フォーマッタ（ビルトイン含む）は警告なく
 * 上書きされる。
 *
 * レジストリは ESM 版と CJS 版で共有されない。登録側と利用側は同じモジュール形式
 * (`import` または `require`) で `ya-kansuji` を読み込むこと。
 *
 * @param name フォーマッタ名。{@link toKan} の第2引数に渡して選択する
 * @param formatter `(num: bigint, options?) => string`。`num` は常に 0 以上
 * @throws {TypeError} `formatter` が関数でない場合
 */
export function registerFormatter(name: string, formatter: KansujiFormatter): void {
  if (typeof formatter !== 'function') {
    throw new TypeError('Registering invalid formatter.')
  }
  formatters.set(name, formatter)
}

/**
 * 登録済みフォーマッタを名前で取得する。未登録なら `undefined`。
 *
 * @param name フォーマッタ名
 * @returns フォーマッタ関数、なければ `undefined`
 */
export function getFormatter(name: string): KansujiFormatter | undefined {
  return formatters.get(name)
}

/**
 * 数値を漢数字・漢字混じりの文字列へ整形する。
 *
 * 負数は先頭に「マイナス」を付け、絶対値をフォーマッタに渡す（フォーマッタが受け取るのは
 * 常に非負値）。`number` は安全整数でなければならず、より大きな値は `bigint` で渡すこと。
 * ビルトインフォーマッタが表現できるのは絶対値 `10^72 − 1` まで。
 *
 * @param num 変換対象。`number`（安全整数）または `bigint`
 * @param formatter フォーマッタ名、またはフォーマッタ関数。既定は `'simple'`
 * @param options フォーマッタへ渡すオプション（ビルトインは未使用）
 * @returns 整形後の文字列
 * @throws {RangeError} `num` が非整数、安全整数を超える `number`、またはビルトイン
 *   フォーマッタの表現範囲を超える場合
 * @throws {TypeError} 指定した名前のフォーマッタが見つからない場合
 * @example
 * toKan(12345)           // => '一万二千三百四十五'
 * toKan(12340005, 'gov') // => '1234万, 5'
 * toKan(-1234)           // => 'マイナス千二百三十四'
 */
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
  if (value < 0n) return `マイナス${toKan(-value, formatter, options)}`

  const fn = typeof formatter === 'function' ? formatter : formatters.get(formatter)
  if (!fn) throw new TypeError(`Unable to find formatter ${String(formatter)}`)
  return fn(value, options)
}
