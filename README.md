# ya-kansuji

[![npm version](https://img.shields.io/npm/v/ya-kansuji.svg)](https://www.npmjs.com/package/ya-kansuji)
[![CI](https://github.com/sugi/ya-kansuji-js/actions/workflows/ci.yml/badge.svg)](https://github.com/sugi/ya-kansuji-js/actions/workflows/ci.yml)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/ya-kansuji)](https://bundlephobia.com/package/ya-kansuji)
[![license](https://img.shields.io/npm/l/ya-kansuji.svg)](https://github.com/sugi/ya-kansuji-js/blob/master/LICENSE)

Yet another (ultimate) Japanese Kansuji library for JavaScript/TypeScript.

`ya-kansuji` は Ruby gem [ya_kansuji](https://github.com/sugi/ya_kansuji) の TypeScript/JavaScript 移植版です。漢数字・大字・全角数字混じりのテキストと数値を相互変換します。対応する Ruby 版は ya_kansuji 1.3.0 です。

現状のサポートは日本語で万進な10進数だけです。歴史的に使われたことのあった万万進や他の漢字圏の漢数字はサポートしていません。

## 機能

* 読み取り: 以下の混在したテキストを数値に変換できます
  * 漢数字 (二万三千五百六十七)
  * 全角数字 (１２３４)
  * 単位なし / ゼロ (一六九〇)
  * 位取り (2億0010万 / 千〇〇二)
  * 大字 (千皕卅肆)
  * カンマ表現 (12,345 / 5億3,456万 / 二万、五十)
* 数値から漢数字、漢字混じり数値文字列へのフォーマット
  * 複数のビルトインフォーマッタ
  * フォーマッタプラグイン機構
  * 小数（分厘毛〜清浄）

## インストール

```bash
npm install ya-kansuji
```

## 使い方

### 読み取り (漢数字 → 数値)

`toNumber` に文字列を渡すと数値 (`number`) に変換できます。読み取りに関してオプションはありません。

```ts
import { toNumber } from 'ya-kansuji'

toNumber('一〇二四') // => 1024
```

無量大数 (10^68) など `Number.MAX_SAFE_INTEGER` を超える値を扱う場合は、`bigint` を返す `toBigInt` を使ってください。`toNumber` は範囲を超える値に対して `RangeError` を投げます。

```ts
import { toBigInt, toNumber } from 'ya-kansuji'

toBigInt('一無量大数') // => 100000000000000000000000000000000000000000000000000000000000000000000n
toNumber('一無量大数') // throws RangeError
```

#### 入力長の上限

`toBigInt` / `toNumber` が受け付ける入力は最大 `MAX_INPUT_LENGTH`（16384 コードユニット）です。これを超える入力には `RangeError` を投げます。上限は入力文字列の**長さ**に対するもので、変換後の**値**に上限はありません（無量大数を超える大きさも扱えます）。この上限により、任意長テキストを渡してもパースの最悪計算コストが有界になります。`toKan` に 10 進数文字列（`'1.05'` や `'1e20'` など）を渡す場合も同じ上限が適用されます。

```ts
import { MAX_INPUT_LENGTH, toBigInt } from 'ya-kansuji'

MAX_INPUT_LENGTH                            // => 16384
toBigInt('一'.repeat(MAX_INPUT_LENGTH))     // OK
toBigInt('一'.repeat(MAX_INPUT_LENGTH + 1)) // throws RangeError
```

先頭の「マイナス」は負の符号として解釈します。ASCII の `-` や Unicode の `−` (U+2212) は符号として扱いません。

```ts
toNumber('マイナス千二百三十四') // => -1234
toNumber('マイナス 五十')        // => -50 (区切り文字は除去してから照合します)
toNumber('2019-04')             // => 2019
```

### フォーマット (数値 → 漢数字)

`toKan` に数値 (`number` または `bigint`) を渡すと、漢数字や漢字混じりの文字列に変換します。

```ts
import { toKan } from 'ya-kansuji'

toKan(12345) // => '一万二千三百四十五'
```

第2引数にフォーマッタ名を渡すことで、出力形式を切り替えられます。

```ts
toKan(12340005, 'simple')  // => '千二百三十四万五'
toKan(12340005, 'gov')     // => '1234万, 5'
toKan(12340005, 'lawyer')  // => '1,234万5'
toKan(12340005, 'judic_v') // => '一二三四万〇〇〇五'
toKan(12340005, 'judic_h') // => '１２３４万０００５'
```

現在あるビルトインフォーマッタは以下のとおりです (`toKan(10003, ...)` の実出力):

| フォーマッタ | 説明 | 出力例 |
| --- | --- | --- |
| `simple` | 標準 | `一万三` |
| `gov` | 「公用文作成の要領」方式 | `1万, 3` |
| `lawyer` | 行政司法協会方式 | `1万3` |
| `judic_v` | 裁判判例縦書き方式 | `一万〇〇〇三` |
| `judic_h` | 最高裁判例横書き方式 | `１万０００３` |

負数を渡すと先頭に「マイナス」を付け、絶対値をフォーマッタに渡します。フォーマッタが受け取るのは常に非負の値です。

```ts
toKan(-1234)         // => 'マイナス千二百三十四'
toKan(-10003, 'gov') // => 'マイナス1万, 3'
```

#### 小数

非整数の `number`、または 10 進数文字列を渡すと、小数の命数法（分 = 10⁻¹ 〜 清浄 = 10⁻²¹）で小数部を出力します。10⁻²¹ より小さい部分は四捨五入されます。

```ts
toKan(0.5)                // => '五分'
toKan(123.456)            // => '百二十三・四分五厘六毛'
toKan(3.14159, 'judic_v') // => '三・一四一五九'
toKan(123.456, 'gov')     // => '123.456'
toKan(1.05, 'judic_h')    // => '１．０５'
```

`number` は `String(num)` の最短 10 進表現として解釈されるため、`0.1` は正確に「一分」になります。逆に浮動小数点演算の誤差はそのまま出力されます（`0.1 + 0.2` → `0.30000000000000004` → 「三分四弾指」）。誤差や float の精度限界（有効 15〜17 桁）を避けたい場合は 10 進数文字列を渡してください（Ruby 版の Rational / BigDecimal に相当します）。

```ts
toKan(0.1 + 0.2)                 // => '三分四弾指'
toKan('0.123456789012345678901') // => 21 桁の小数もそのまま扱える
toKan('1e20')                    // => '一垓' (安全整数を超える値も文字列なら正確)
```

文字列として受け付けるのは `-?\d+(\.\d+)?([eE][+-]?\d+)?` 形式の 10 進表記のみで、漢数字文字列は解釈しません。`toBigInt` / `toNumber` と同じく、入力長は `MAX_INPUT_LENGTH` までです。整数の `number` は従来どおり安全整数のみ受け付けます（`toKan(1e21)` は `RangeError`。`toKan('1e21')` か `bigint` を使ってください）。

小数を渡した場合の各フォーマッタの出力（`toKan(1.05, ...)` と `toKan(12340000.5, ...)` の実出力）:

| フォーマッタ | 1.05 | 12340000.5 |
| --- | --- | --- |
| `simple` | `一・五厘` | `千二百三十四万・五分` |
| `gov` | `1.05` | `1234万, 0.5` |
| `lawyer` | `1.05` | `1,234万0.5` |
| `judic_v` | `一・〇五` | `一二三四万〇〇〇〇・五` |
| `judic_h` | `１．０５` | `１２３４万００００．５` |

より大きな値は `bigint` で渡せますが、組み込みフォーマッタが表現できる範囲は整数部の絶対値が `10^72 - 1` 以下です。
範囲を超える値には `RangeError` を投げます。

```ts
toKan(10n ** 72n) // throws RangeError
```

`simple`、`gov`、`lawyer`、`judicV`、`judicH` を直接呼び出す場合、入力は `0n` 以上 `10n ** 72n - 1n` 以下でなければなりません。
負数や範囲を超える値には `RangeError` を投げます。
負数をフォーマットする場合は、符号処理を行う `toKan` を使用してください。

#### 独自フォーマッタ

`registerFormatter` を使うと独自のフォーマッタを登録できます。第1引数に名前、第2引数に `(num: KansujiValue, options?) => string` の関数を渡します。

```ts
import { registerFormatter, toKan } from 'ya-kansuji'

registerFormatter('hoge', (num) => {
  if (num === 0n) return ''
  if (num === 1n) return 'いち'
  if (num === 2n) return 'に'
  return 'たくさん'
})

toKan(2, 'hoge')   // => 'に'
toKan(123, 'hoge') // => 'たくさん'
```

登録済みフォーマッタは `getFormatter(name)` で取得できます。`toKan` の第2引数にはフォーマッタ名の代わりに関数を直接渡すこともできます。

フォーマッタが受け取るのは正規化済みの非負値です。整数なら `bigint`、小数を含む値なら `KansujiFraction`（`{ int: bigint, frac: readonly number[] }`）が渡ります。`splitFraction` を使うと整数部と小数桁（最上位から、末尾ゼロ除去済み）に分解できます。

```ts
import { registerFormatter, splitFraction, toKan } from 'ya-kansuji'

registerFormatter('csv', (num) => {
  const [int, frac] = splitFraction(num)
  return frac.length === 0 ? String(int) : `${int}.${frac.join('')}`
})
toKan(1234.5, 'csv') // => '1234.5'
```

ESM 版 (`dist/index.js`) と CJS 版 (`dist/index.cjs`) はそれぞれ別モジュールとしてロードされ、フォーマッタのレジストリ (`Map`) を共有しません。`registerFormatter` で登録したフォーマッタを使う側は、登録した側と同じモジュール形式 (`import` または `require`) で `ya-kansuji` を読み込んでください。

### CDN での使用

npm 経由のインストールなしに、CDN から直接読み込むこともできます。

```html
<!-- script タグ (グローバル YaKansuji) -->
<script src="https://cdn.jsdelivr.net/npm/ya-kansuji@1.0.0/dist/index.iife.min.js"></script>
<script>
  console.log(YaKansuji.toKan(1234)); // => 千二百三十四
</script>

<!-- ES Modules -->
<script type="module">
  import { toNumber } from 'https://cdn.jsdelivr.net/npm/ya-kansuji@1.0.0/+esm';
  console.log(toNumber('九億６千万卌一')); // => 960000041
</script>
```

## Ruby 版との差分

Ruby 版 [ya_kansuji](https://github.com/sugi/ya_kansuji) からの移植にあたり、以下の点が異なります。

1. **標準クラスの拡張は移植していません。** Ruby 版にある `String#to_i` の置き換えや `Integer#to_kan` の追加 (`core_ext` / `CoreRefine`) に相当する機能はありません。常に `toNumber` / `toBigInt` / `toKan` を明示的に呼び出してください。
2. **`toKan` は安全範囲外の整数 `number` を受け付けません。** 負数は Ruby 版と同様に先頭へ「マイナス」を付け、絶対値をフォーマッタに渡して処理します (`toKan(-1234)` → `'マイナス千二百三十四'`、Ruby の `to_kan(-1234)` と一致)。非整数の `number` は Ruby 版 1.3.0 の小数対応（Rational / BigDecimal 相当）に合わせて小数として整形します (`toKan(1.05)` → `'一・五厘'`)。一方、`Number.MAX_SAFE_INTEGER` (2^53 - 1) を超える整数の `number` を渡した場合は JS 版のみ `RangeError` です（Ruby の `Integer` は任意精度）。`bigint` では絶対値 `10^72 - 1` まで扱えます。
3. **`to_i` に相当する変換が `toBigInt` / `toNumber` の2関数に分かれています。** 無量大数 (10^68) は JavaScript の `Number.MAX_SAFE_INTEGER` (2^53 - 1) を大きく超えるため、常に安全な `bigint` を返す `toBigInt` と、安全な範囲を超えると `RangeError` を投げる `toNumber` を用途に応じて使い分けます。

### 既知の非互換

かつて Ruby 版 `YaKansuji::REGEXP_PART` は 1.0.x まで、正規表現の文字クラスに配列を `#{}` 展開しており、`Array#to_s` (= `inspect`) の結果 (`["十", "百", ...]` のような、ダブルクォートやカンマを含む文字列表現) をそのまま埋め込む事故を起こしていました。この副作用で 1.0.x の `YaKansuji.to_i` は数値列中に `"` (U+0022) が混ざっていても無視して受理していました (`to_i('1"000')` → `1000`)。JS 版はこの事故を再現していないため、以前から `toBigInt('1"000')` は `"` の手前で読み取りが止まり `1` を返しており、**ya_kansuji 1.1.0 でこのバグが修正された結果、両者の挙動は一致しました** (Ruby 1.1.0 の `to_i('1"000')` も `1`)。

空白除去の実装は Ruby 版の `[[:space:]]` と JS 版の `\s` とで対象が完全には一致せず、U+0085 (NEL) と U+FEFF (BOM) の2コードポイントだけ挙動が異なります (Ruby は NEL を空白として除去し BOM は除去しない、JS はその逆)。

## License

The package is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## Author

Tatsuki Sugiura <sugi@nemui.org>
