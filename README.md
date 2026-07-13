# ya-kansuji

Yet another (ultimate) Japanese Kansuji library for JavaScript/TypeScript.

`ya-kansuji` は Ruby gem [ya_kansuji](https://github.com/sugi/ya_kansuji) の TypeScript/JavaScript 移植版です。漢数字・大字・全角数字混じりのテキストと数値を相互変換します。

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

`toKan` は負数と非整数の `number` を受け付けず、`RangeError` を投げます (`bigint` を渡せば任意の非負整数を表現できます)。

```ts
toKan(-1)  // throws RangeError
toKan(1.5) // throws RangeError
```

#### 独自フォーマッタ

`registerFormatter` を使うと独自のフォーマッタを登録できます。第1引数に名前、第2引数に `(num: bigint, options?) => string` の関数を渡します。

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

ESM 版 (`dist/index.js`) と CJS 版 (`dist/index.cjs`) はそれぞれ別モジュールとしてロードされ、フォーマッタのレジストリ (`Map`) を共有しません。`registerFormatter` で登録したフォーマッタを使う側は、登録した側と同じモジュール形式 (`import` または `require`) で `ya-kansuji` を読み込んでください。

### CDN での使用

npm 経由のインストールなしに、CDN から直接読み込むこともできます。

```html
<!-- script タグ (グローバル YaKansuji) -->
<script src="https://cdn.jsdelivr.net/npm/ya-kansuji@0.1.0/dist/index.iife.min.js"></script>
<script>
  console.log(YaKansuji.toKan(1234)); // => 千二百三十四
</script>

<!-- ES Modules -->
<script type="module">
  import { toNumber } from 'https://cdn.jsdelivr.net/npm/ya-kansuji@0.1.0/+esm';
  console.log(toNumber('九億６千万卌一')); // => 960000041
</script>
```

## Ruby 版との差分

Ruby 版 [ya_kansuji](https://github.com/sugi/ya_kansuji) からの移植にあたり、以下の点が異なります。

1. **標準クラスの拡張は移植していません。** Ruby 版にある `String#to_i` の置き換えや `Integer#to_kan` の追加 (`core_ext` / `CoreRefine`) に相当する機能はありません。常に `toNumber` / `toBigInt` / `toKan` を明示的に呼び出してください。
2. **`toKan` は負数・非整数・安全範囲外の `number` を受け付けません。** Ruby 版は `to_kan` の内部で単に `to_i` を呼ぶだけで検証をしていません。負数は例外なく無意味な巨大文字列を返します (`to_kan(-1)` は内部演算がそのまま流れ込み、`無量大数` 級の桁を持つ意味のない文字列になります)。小数は `Float#to_i` による切り捨てで普通に処理が通ります (`to_kan(1.5)` → `"一"`)。JS 版はどちらも `RangeError` を投げます。加えて `Number.MAX_SAFE_INTEGER` (2^53 - 1) を超える `number` を渡した場合も JS 版は `RangeError` です (`bigint` として渡せば任意の非負整数を扱えます)。
3. **`to_i` に相当する変換が `toBigInt` / `toNumber` の2関数に分かれています。** 無量大数 (10^68) は JavaScript の `Number.MAX_SAFE_INTEGER` (2^53 - 1) を大きく超えるため、常に安全な `bigint` を返す `toBigInt` と、安全な範囲を超えると `RangeError` を投げる `toNumber` を用途に応じて使い分けます。

### 既知の非互換 (Ruby 版のバグ由来)

Ruby 版 `YaKansuji::REGEXP_PART` は正規表現の文字クラスに配列を `#{}` 展開しており、これが `Array#to_s` (= `inspect`) の結果 (`["十", "百", ...]` のような、ダブルクォートやカンマを含む文字列表現) をそのまま埋め込んでしまう事故を起こしています。この副作用で Ruby 版の `YaKansuji.to_i` は数値列中に `"` (U+0022) が混ざっていても無視して受理します (`YaKansuji.to_i('1"000')` → `1000`)。JS 版はこの事故を再現しないため、`toBigInt('1"000')` は `"` の手前で読み取りが止まり `1` になります。あわせて空白除去の実装も Ruby 版の `[[:space:]]` と JS 版の `\s` とで対象が完全には一致せず、U+0085 (NEL) と U+FEFF (BOM) の2コードポイントだけ挙動が異なります (Ruby は NEL を空白として除去し BOM は除去しない、JS はその逆)。

## License

The package is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## Author

Tatsuki Sugiura <sugi@nemui.org>
