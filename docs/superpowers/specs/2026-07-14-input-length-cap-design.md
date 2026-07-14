# 入力長上限の導入と 1.0.0 リリース 設計

**日付:** 2026-07-14
**対象:** `ya-kansuji-js`
**関連:** `strix_runs/ya-kansuji-js_1455/penetration_test_report.md`（High: Uncontrolled Resource Consumption, CVSS 7.5）

## 背景と課題

ペネトレーションテストで、`toBigInt` / `toNumber` のテキストパースに High severity の
リソース枯渇（DoS）脆弱性が確認された。

根本原因は `src/parse.ts` の桁累算ループ:

```ts
curnum = (curnum ?? 0n) * 10n + digit
```

マッチした数値ラン中の各桁で `curnum * 10n` を行うが、`bigint` 乗算のコストは
オペランド長に比例して増大する。オペランド長は入力長とともに伸びるため、
累算全体は入力長に対して **O(n²)** になる。パース経路のどこにも長さ上限がない。

実測: 100k 文字 ≈ 0.5s、200k 文字 ≈ 2.2s、400k 文字 ≈ 17.2s。
単一の中規模テキストペイロードで Node.js プロセスを長時間ブロックできる。

補足: `KANSUJI_REGEXP` は非アンカーで、`toBigInt` は任意テキスト中の
**先頭の連続数値ラン** を抽出する用途を持つ（例: `toBigInt('何か千〇十とか1')` → `1010n`、
`toNumber('2019-04')` → `2019`）。この挙動は維持する。

## 決定事項

ブレインストーミングで以下を確定した。

| 項目 | 決定 | 理由 |
| --- | --- | --- |
| 上限を掛ける対象 | **生入力長**（`String(str).length`、cleaning 前） | 1 ガードで clean/regex/累算の全経路を保護。最もシンプル。 |
| 上限値 `MAX_INPUT_LENGTH` | **16384**（UTF-16 コードユニット） | 全桁数字時の最悪パースコスト ≈ 13ms。現実の入力に十分寛容。 |
| 上限超過時の挙動 | **`RangeError` を投げる** | 既存の `toNumber` / `toKan` のエラー契約に整合。fail-fast。 |
| アルゴリズム線形化 | **行わない**（上限のみ） | 上限で最悪コストが自明に有界になり二次性は無害化。変更・回帰リスク最小。 |

## 変更内容

### 1. 入力長ガード — `src/parse.ts`

- モジュールレベルに定数を追加し、`index.ts` から再エクスポートする:

  ```ts
  export const MAX_INPUT_LENGTH = 16384
  ```

  公開エクスポートとすることで、利用側が事前チェックや有界コストの前提に利用できる
  （report 推奨 #3）。

- `toBigInt` の先頭、`clean()` 呼び出しの **前** にガードを置く:

  ```ts
  export function toBigInt(str: string): bigint {
    const s = String(str)
    if (s.length > MAX_INPUT_LENGTH) {
      throw new RangeError(`kansuji input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`)
    }
    const cleaned = clean(s)
    // ...以降は現状のまま
  }
  ```

- チェックは cleaning 前の生 UTF-16 コードユニット長 (`s.length`) に対して行う。
  これにより 1 つのガードで `clean()` と正規表現経路も保護される。
  サロゲートペア（例: `𥝱` = 2 コードユニット）はコードポイント換算で上限を
  わずかに厳しくする方向に働くだけで、安全側。

- `toNumber` は `toBigInt` を呼ぶため、ガードを自動的に継承する。

### 契約変更（意図的）

- `toBigInt` はこれまで **決して throw しなかった**（非マッチ時 `0n`）。本変更で
  入力長が 16384 コードユニットを超える場合に `RangeError` を投げるようになる。
  0.1.0 → 1.0.0 の節目として許容する。
- **値**の上限は従来どおり無い（無量大数超えも扱える）。上限が掛かるのは入力の
  **長さ**のみ。

### 2. テスト — `test/parse.test.ts`

- 境界: ちょうど `MAX_INPUT_LENGTH` の入力は throw せずにパースできる。
- 超過: `MAX_INPUT_LENGTH + 1` の入力は `RangeError` を投げる。
- `toNumber` も過長入力で `RangeError` を投げる。
- 回帰ガード: 大きな敵対的全桁数字入力（約 1,000,000 文字）が `RangeError` を投げ、
  即座に返る（ガードは累算前に O(1) で棄却する）。CI のフレーク回避のため厳密な
  時間アサーションは置かない（棄却が累算前に起きること自体を検証）。report 推奨 #4 を安価に満たす。
- 既存の抽出テスト（いずれも短い）は影響を受けない。

### 3. ドキュメントとリリース

- `README.md`:
  - 読み取りセクションに `MAX_INPUT_LENGTH` と過長時の `RangeError` を明記。
  - 「値は無制限だが入力長は上限あり」を明確化。
  - 最悪パースコストが有界である旨を追記（report 推奨 #3）。
  - CDN 例の URL `@0.1.0` → `@1.0.0` に更新。
- `CHANGELOG.md`: `[1.0.0] - 2026-07-14` を追加。`Security` / `Changed` 項目として
  長さ上限と `RangeError` を記載。compare リンクを更新。
- `package.json`: `version` `0.1.0` → `1.0.0`。

## スコープ外

- 累算アルゴリズムの線形化（チャンク化）。上限により二次性は無害化されるため見送り、
  将来上限を引き上げる際の検討事項として残す。
- フォーマッタ経路。`groups4` が既に 10^72 で `RangeError` を投げ有界。
- `strix_runs/`（公開 `files` に含まれず、パッケージには同梱されない）。

## 検証

- `npm test`（vitest）が green。
- `npm run typecheck` がクリーン。
- 任意: パースコストが過大入力に対して即座に棄却されることをベンチで再確認。
