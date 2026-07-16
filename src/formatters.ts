import { gov } from './formatter/gov.js'
import { judicH, judicV } from './formatter/judic.js'
import { lawyer } from './formatter/lawyer.js'
import { simple } from './formatter/simple.js'
import { normalizeValue, type KansujiValue } from './value.js'

/** フォーマッタに渡す任意のオプション。ビルトインフォーマッタは参照しない。 */
export type KansujiFormatterOptions = Record<string, unknown>

/**
 * 非負の正規化済み値を文字列へ整形する関数。{@link toKan} は符号処理と正規化を済ませた
 * うえで、整数なら bigint、小数を含む値なら {@link KansujiFraction} を渡す。
 * {@link splitFraction} で整数部と小数桁に分解できる。
 */
export type KansujiFormatter = (num: KansujiValue, options?: KansujiFormatterOptions) => string

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
 * @param formatter `(num: KansujiValue, options?) => string`。`num` は常に 0 以上の正規化済みの値
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
 * 常に非負の正規化済み値）。整数の `number` は安全整数でなければならず、より大きな値は
 * `bigint` か 10 進文字列で渡すこと。非整数の `number` は `String(num)` の最短 10 進表現
 * として解釈する。文字列は `-?\d+(\.\d+)?([eE][+-]?\d+)?` 形式のみ受け付け、長さは
 * {@link MAX_INPUT_LENGTH} まで。小数部は 10^-21（清浄）で四捨五入する。
 * ビルトインフォーマッタが表現できるのは整数部の絶対値 `10^72 − 1` まで。
 *
 * @param num 変換対象。`number`、`bigint`、または 10 進数文字列
 * @param formatter フォーマッタ名、またはフォーマッタ関数。既定は `'simple'`
 * @param options フォーマッタへ渡すオプション（ビルトインは未使用）
 * @returns 整形後の文字列
 * @throws {RangeError} `num` が NaN・無限大・安全整数を超える整数 `number`・不正な形式の
 *   文字列、またはビルトインフォーマッタの表現範囲を超える場合
 * @throws {TypeError} 指定した名前のフォーマッタが見つからない場合
 * @example
 * toKan(12345)           // => '一万二千三百四十五'
 * toKan(12340005, 'gov') // => '1234万, 5'
 * toKan(-1234)           // => 'マイナス千二百三十四'
 * toKan(1.05)            // => '一・五厘'
 * toKan('123.456', 'gov') // => '123.456'
 */
export function toKan(
  num: number | bigint | string,
  formatter: string | KansujiFormatter = 'simple',
  options: KansujiFormatterOptions = {},
): string {
  const { negative, value } = normalizeValue(num)
  const fn = typeof formatter === 'function' ? formatter : formatters.get(formatter)
  if (!fn) throw new TypeError(`Unable to find formatter ${String(formatter)}`)
  const ret = fn(value, options)
  return negative ? `マイナス${ret}` : ret
}
