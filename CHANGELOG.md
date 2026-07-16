# Changelog

このプロジェクトの主な変更点を記録する。書式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠し、[Semantic Versioning](https://semver.org/lang/ja/) に従う。

## [Unreleased]

## [1.1.0] - 2026-07-17

### Added

- 小数サポート（Ruby 版 ya_kansuji 1.3.0 相当）。`toKan` が非整数の `number` と 10 進数文字列を
  受理し、小数部を各フォーマッタ固有のスタイルで出力する（`simple` は分〜清浄の命数法、
  ほかは小数点表記）。端数は 10⁻²¹（清浄）で四捨五入。`number` は最短 10 進表現
  （`String(num)`）として解釈する。
- `splitFraction` / `UNIT_FRAC` と型 `KansujiValue` / `KansujiFraction` を公開エクスポートに追加。
- `toKan` の 10 進文字列入力にも入力長上限 `MAX_INPUT_LENGTH` を適用（DoS 防止）。
  巨大な指数（`'1e999999999'` など）も値を構築せず `RangeError` にする。

### Changed

- `KansujiFormatter` の引数型を `bigint` から `KansujiValue`（`bigint | KansujiFraction`）に拡張。
  整数入力での実行時挙動は完全互換だが、`(num: bigint) => string` と明示注釈した
  カスタムフォーマッタは型エラーになる場合がある。
- 従来 `RangeError` だった非整数 `number` の `toKan` 入力（例: `toKan(1.5)`）は
  小数として整形されるようになった。

## [1.0.0] - 2026-07-14

### Security

- `toBigInt` / `toNumber` に入力長の上限 `MAX_INPUT_LENGTH`（16384 コードユニット）を導入。
  過大な入力によるリソース枯渇（DoS）を防ぐため、上限超過時は `RangeError` を投げる。
  値そのものに上限はなく、上限が掛かるのは入力の長さのみ。
  従来 `toBigInt` は例外を投げなかったが、過長入力に対しては投げるようになった（破壊的変更）。

### Added

- `MAX_INPUT_LENGTH` を公開エクスポートに追加。

## [0.1.0] - 2026-07-14

初回リリース。Ruby gem [ya_kansuji](https://github.com/sugi/ya_kansuji) 1.1.0 の TypeScript/JavaScript 移植版。

### Added

- 読み取り: `toNumber` / `toBigInt` — 漢数字・大字・全角数字・カンマ表現・位取り・単位なし表記が混在したテキストを数値へ変換。
- フォーマット: `toKan` と 5 つのビルトインフォーマッタ（`simple` / `gov` / `lawyer` / `judicV` / `judicH`）。
- `registerFormatter` / `getFormatter` によるフォーマッタプラグイン機構。
- ESM・CommonJS・IIFE（CDN 用）ビルドと型定義を同梱。

[Unreleased]: https://github.com/sugi/ya-kansuji-js/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/sugi/ya-kansuji-js/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/sugi/ya-kansuji-js/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/sugi/ya-kansuji-js/releases/tag/v0.1.0
