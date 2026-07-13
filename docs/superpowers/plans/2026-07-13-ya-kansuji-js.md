# ya-kansuji-js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ruby gem ya_kansuji の TypeScript 移植。漢数字⇔数値の相互変換を npm + CDN (IIFE) で配布可能にする。

**Architecture:** 純関数の named export のみで構成する。パースは BigInt を正とし (無量大数 = 10^68 が Number を超えるため)、フォーマッタは名前付きレジストリ (Map) に静的登録する。モジュール読み込み時の副作用は持たない (`sideEffects: false` で tree-shaking されても壊れないようにするため)。

**Tech Stack:** TypeScript (strict) / tsdown (ESM + CJS + IIFE + d.ts) / Vitest / publint + @arethetypeswrong/cli

**設計仕様:** `~/works/git/github/ya-wareki-js/docs/superpowers/specs/2026-07-13-ya-wareki-js-design.md` の「ya-kansuji API 設計」節。
**移植元:** `~/works/git/github/ya_kansuji/lib/` (アルゴリズム) と `~/works/git/github/ya_kansuji/spec/` (期待値)。

## Global Constraints

- パッケージ名 `ya-kansuji`、バージョン `0.1.0`、ライセンス BSD-2-Clause、`engines: { "node": ">=20" }`。
- `"type": "module"`。ESM `dist/index.js` + CJS `dist/index.cjs` + IIFE `dist/index.iife.min.js` (グローバル名 `YaKansuji`)。
- `sideEffects: false`。import 時に副作用を持つコードを書かない。
- 組み込みフォーマッタの登録名は Ruby と同じ `simple` / `gov` / `lawyer` / `judic_v` / `judic_h`。
- Ruby 版との意図的な差分は3つだけ: (1) String/Integer のクラス拡張は移植しない、(2) 負数は RangeError、(3) `to_i` は `toBigInt`/`toNumber` の2関数に分割。それ以外の入出力は Ruby 版と完全一致させる。
- コミットメッセージは英語。インラインコメントは外部要因や背景事情の説明に限る。
- **`'𥝱'.length === 2`** (サロゲートペア)。文字単位の処理は必ず `Array.from` / `for...of` / spread を使い、`.length` や添字アクセスでコードポイントを数えない。

---

### Task 1: リポジトリ雛形とビルドパイプライン

**推奨モデル:** Sonnet

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsdown.config.ts`, `.gitignore`, `LICENSE`, `src/index.ts`, `test/smoke.test.ts`

**Interfaces:**
- Produces: `npm run build` が `dist/index.js` (ESM) / `dist/index.cjs` / `dist/index.d.ts` / `dist/index.iife.min.js` を出力する。`npm test` が Vitest を実行する。

- [ ] **Step 1: package.json を作成**

```json
{
  "name": "ya-kansuji",
  "version": "0.1.0",
  "description": "Yet another Japanese kansuji library — converts Japanese numerals (漢数字・大字・全角) to/from numbers",
  "keywords": ["kansuji", "japanese", "numeral", "漢数字", "大字"],
  "license": "BSD-2-Clause",
  "author": "Tatsuki Sugiura <sugi@nemui.org>",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "unpkg": "./dist/index.iife.min.js",
  "jsdelivr": "./dist/index.iife.min.js",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "files": ["dist", "src", "README.md", "LICENSE"],
  "sideEffects": false,
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm test && npx publint && npx @arethetypeswrong/cli --pack ."
  },
  "devDependencies": {
    "tsdown": "^0.12.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json を作成**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "declaration": false,
    "noEmit": true
  },
  "include": ["src", "test", "tsdown.config.ts"]
}
```

- [ ] **Step 3: tsdown.config.ts を作成**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
  },
  {
    entry: { 'index.iife.min': 'src/index.ts' },
    format: ['iife'],
    globalName: 'YaKansuji',
    minify: true,
    dts: false,
    clean: false,
  },
])
```

tsdown のバージョンによりオプション名が異なる場合は https://tsdown.dev/ を参照して同等の設定に読み替える。IIFE 出力がどうしても得られない場合のフォールバックは tsup (設定はほぼ同形)。

- [ ] **Step 4: .gitignore と LICENSE を作成**

`.gitignore`:

```
node_modules/
dist/
```

`LICENSE` は Ruby 版と同じ BSD-2-Clause 全文 (`~/works/git/github/ya_kansuji/LICENSE.txt` をコピーし、年を 2026、著者を Tatsuki Sugiura のままにする)。

- [ ] **Step 5: 仮の src/index.ts とスモークテストを作成**

`src/index.ts`:

```ts
export const VERSION = '0.1.0'
```

`test/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { VERSION } from '../src/index.js'

describe('package', () => {
  it('has a version number', () => {
    expect(VERSION).toBe('0.1.0')
  })
})
```

- [ ] **Step 6: 依存を導入してテストとビルドを検証**

Run: `npm install && npm test && npm run build && ls dist/`
Expected: テスト 1 件 PASS。`dist/` に `index.js` `index.cjs` `index.d.ts` `index.d.cts` `index.iife.min.js` が並ぶ。

Run: `node -e "const k = require('./dist/index.cjs'); console.log(k.VERSION)"`
Expected: `0.1.0`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold TypeScript package with tsdown build (ESM/CJS/IIFE)"
```

---

### Task 2: 漢数字パース (toBigInt / toNumber)

**推奨モデル:** Opus

**Files:**
- Create: `src/constants.ts`, `src/parse.ts`
- Modify: `src/index.ts`
- Test: `test/parse.test.ts`

**Interfaces:**
- Produces: `toBigInt(str: string): bigint` (マッチなしは `0n`)、`toNumber(str: string): number` (`Number.MAX_SAFE_INTEGER` 超で RangeError)。`constants.ts` の `UNIT_EXP3: readonly string[]`、`UNIT_EXP4: readonly string[]` は Task 3 のフォーマッタも使う。

移植元: `~/works/git/github/ya_kansuji/lib/ya_kansuji.rb` の `to_i` (39-81行)。アルゴリズム(正規化 → 区切り除去 → 最初の連続マッチを走査 → 3桁単位/4桁単位の畳み込み)を変えずに移植する。

- [ ] **Step 1: 失敗するテストを書く**

`test/parse.test.ts` (期待値は `~/works/git/github/ya_kansuji/spec/ya_kansuji_spec.rb` から転記):

```ts
import { describe, expect, it } from 'vitest'
import { toBigInt, toNumber } from '../src/index.js'

describe('toNumber', () => {
  it('converts kansuji to number', () => {
    expect(toNumber('千二百三十四')).toBe(1234)
    expect(toNumber('百卄')).toBe(120)
    expect(toNumber('一二三四')).toBe(1234)
    expect(toNumber('千皕卅肆')).toBe(1234)
    expect(toNumber('一〇〇〇五')).toBe(10_005)
    expect(toNumber('〇')).toBe(0)
    expect(toNumber('零')).toBe(0)
    expect(toNumber('元')).toBe(0)
    expect(toNumber('五万廿')).toBe(50_020)
    expect(toNumber('百七十八万二')).toBe(1_780_002)
    expect(toNumber('九億６千万卌一')).toBe(960_000_041)
    expect(toNumber('肆陸')).toBe(46)
    expect(toNumber('弐仟柒佰玖什')).toBe(2790)
    expect(toNumber('捌萬貳拾')).toBe(80_020)
    expect(toNumber('伍〇')).toBe(50)
    expect(toNumber('000023')).toBe(23)
    expect(toNumber('一千〇二十四')).toBe(1024)
    expect(toNumber('二百二十二万零三百零二')).toBe(2_220_302)
    expect(toNumber('六百〇八')).toBe(608)
    expect(toNumber('六百十')).toBe(610)
    expect(toNumber('千〇〇三億')).toBe(100_300_000_000)
    expect(toNumber('千〇十')).toBe(1010)
    expect(toNumber('何か千〇十とか1')).toBe(1010)
  })

  it('converts numbers with separators', () => {
    expect(toNumber('1,000億 5,432万')).toBe(100_054_320_000)
    expect(toNumber('12,345')).toBe(12_345)
    expect(toNumber('二万、五十')).toBe(20_050)
  })

  it('throws RangeError beyond MAX_SAFE_INTEGER', () => {
    expect(() => toNumber('一無量大数')).toThrow(RangeError)
  })
})

describe('toBigInt', () => {
  it('handles values beyond MAX_SAFE_INTEGER', () => {
    expect(toBigInt('一無量大数')).toBe(10n ** 68n)
    expect(toBigInt('千皕卅肆')).toBe(1234n)
    expect(toBigInt('無関係なテキスト')).toBe(0n)
  })

  it('handles the astral unit 𥝱 and its variant 秭', () => {
    expect(toBigInt('三𥝱')).toBe(3n * 10n ** 24n)
    expect(toBigInt('三秭')).toBe(3n * 10n ** 24n)
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run test/parse.test.ts`
Expected: FAIL (`toBigInt` が export されていない)

- [ ] **Step 3: src/constants.ts を実装**

```ts
export const UNIT_EXP3 = ['十', '百', '千'] as const
export const UNIT_EXP4 = [
  '万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗',
  '正', '載', '極', '恒河沙', '阿僧祇', '那由他', '不可思議', '無量大数',
] as const

// Ruby 版の tr 用ペア文字列と同一。コードポイント単位で位置対応している。
export const NUM_ALT_CHARS =
  '〇一二三四五六七八九０１２３４５６７８９零壱壹弌弐貳貮参參弎肆伍陸漆質柒捌玖拾什陌佰阡仟萬秭'
export const NUM_NORMALIZED_CHARS =
  '01234567890123456789011122233345677789十十百百千千万𥝱'
```

- [ ] **Step 4: src/parse.ts を実装**

```ts
import { NUM_ALT_CHARS, NUM_NORMALIZED_CHARS, UNIT_EXP3, UNIT_EXP4 } from './constants.js'

const altChars = Array.from(NUM_ALT_CHARS)
const normChars = Array.from(NUM_NORMALIZED_CHARS)
const NORMALIZE_MAP = new Map(altChars.map((c, i) => [c, normChars[i] as string]))

const SINGLE_UNITS = [...UNIT_EXP3, ...UNIT_EXP4.filter((u) => Array.from(u).length === 1)]
const MULTI_UNITS = UNIT_EXP4.filter((u) => Array.from(u).length > 1)
const CHAR_CLASS = [
  ...new Set([...altChars, ...normChars, ...SINGLE_UNITS, '卄', '廿', '卅', '丗', '卌', '皕']),
].join('')

const PART_SOURCE = `${MULTI_UNITS.join('|')}|[${CHAR_CLASS}]`
const KANSUJI_REGEXP = new RegExp(`(?:${PART_SOURCE})+`, 'u')
const PART_REGEXP = new RegExp(PART_SOURCE, 'gu')

const UNIT_EXP3_INDEX = new Map(UNIT_EXP3.map((u, i) => [u, i]))
const UNIT_EXP4_INDEX = new Map(UNIT_EXP4.map((u, i) => [u, i]))

function normalize(str: string): string {
  return Array.from(str, (c) => NORMALIZE_MAP.get(c) ?? c).join('')
}

export function toBigInt(str: string): bigint {
  const cleaned = normalize(String(str)).replace(/[,，、\s]/gu, '')
  const matched = KANSUJI_REGEXP.exec(cleaned)
  if (!matched) return 0n

  let ret3 = 0n
  let ret4 = 0n
  let curnum: bigint | null = null
  for (const c of matched[0]!.match(PART_REGEXP) ?? []) {
    if (c >= '1' && c <= '9') {
      curnum = (curnum ?? 0n) * 10n + BigInt(c)
    } else if (c === '0') {
      if (curnum !== null) curnum *= 10n
    } else if (c === '卄' || c === '廿') {
      ret3 += 20n
      curnum = null
    } else if (c === '卅' || c === '丗') {
      ret3 += 30n
      curnum = null
    } else if (c === '卌') {
      ret3 += 40n
      curnum = null
    } else if (c === '皕') {
      ret3 += 200n
      curnum = null
    } else if (UNIT_EXP4_INDEX.has(c)) {
      if (curnum !== null) {
        ret3 += curnum
        curnum = null
      }
      if (ret3 === 0n) ret3 = 1n
      ret4 += ret3 * 10n ** BigInt((UNIT_EXP4_INDEX.get(c)! + 1) * 4)
      ret3 = 0n
    } else if (UNIT_EXP3_INDEX.has(c)) {
      curnum ??= 1n
      ret3 += curnum * 10n ** BigInt(UNIT_EXP3_INDEX.get(c)! + 1)
      curnum = null
    }
  }
  if (curnum !== null) ret3 += curnum
  return ret4 + ret3
}

export function toNumber(str: string): number {
  const value = toBigInt(str)
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`kansuji value exceeds Number.MAX_SAFE_INTEGER: ${str}`)
  }
  return Number(value)
}
```

`src/index.ts` を差し替え:

```ts
export { toBigInt, toNumber } from './parse.js'
export { UNIT_EXP3, UNIT_EXP4 } from './constants.js'
export const VERSION = '0.1.0'
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx vitest run test/parse.test.ts && npm run typecheck`
Expected: 全件 PASS、型エラーなし

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: port kansuji-to-number parser with BigInt support"
```

---

### Task 3: フォーマッタレジストリと simple フォーマッタ (toKan)

**推奨モデル:** Sonnet

**Files:**
- Create: `src/formatters.ts`, `src/groups.ts`, `src/formatter/simple.ts`
- Modify: `src/index.ts`
- Test: `test/to-kan.test.ts`, `test/formatter/simple.test.ts`

**Interfaces:**
- Consumes: `UNIT_EXP3` / `UNIT_EXP4` (Task 2 の constants.ts)、`toBigInt` (往復テスト)
- Produces: `toKan(num, formatter?, options?)`、`registerFormatter(name, fn)`、`getFormatter(name)`、型 `KansujiFormatter` / `KansujiFormatterOptions`、`groups4(num): Array<[number, string]>` (groups.ts、Task 4 のフォーマッタも使う内部ヘルパー)、`simple(num: bigint): string`

モジュール依存は一方向に保つ: `formatter/*.ts` → `groups.ts` / `constants.ts`、`formatters.ts` (レジストリ) → `formatter/*.ts`。フォーマッタ実装をレジストリと同居させると循環 import になるため分離する。

移植元: `~/works/git/github/ya_kansuji/lib/ya_kansuji.rb` の `to_kan`/`register_formatter` と `formatter/simple.rb`。

- [ ] **Step 1: 失敗するテストを書く**

`test/formatter/simple.test.ts` (期待値は `spec/ya_kansuji/formatter/simple_spec.rb` から転記):

```ts
import { describe, expect, it } from 'vitest'
import { simple } from '../../src/index.js'

describe('simple formatter', () => {
  it('converts number to kansuji', () => {
    expect(simple(0n)).toBe('零')
    expect(simple(1n)).toBe('一')
    expect(simple(1234n)).toBe('千二百三十四')
    expect(simple(10_003n)).toBe('一万三')
    expect(simple(10_010_003n)).toBe('千一万三')
    expect(simple(100_000_003n)).toBe('一億三')
    expect(simple(200_000_000_056n)).toBe('二千億五十六')
    expect(simple(9_030_000_001_008n)).toBe('九兆三百億千八')
    expect(simple(9_999_999n)).toBe('九百九十九万九千九百九十九')
    expect(simple(9n * 10n ** 68n)).toBe('九無量大数')
    expect(simple(10n ** 68n)).toBe('一無量大数')
  })
})
```

`test/to-kan.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getFormatter, registerFormatter, toBigInt, toKan } from '../src/index.js'

describe('toKan', () => {
  it('formats with the default simple formatter', () => {
    expect(toKan(1234)).toBe('千二百三十四')
    expect(toKan(1234n)).toBe('千二百三十四')
  })

  it('accepts a formatter function directly', () => {
    expect(toKan(5, (n) => `<${n}>`)).toBe('<5>')
  })

  it('runs registered custom formatters', () => {
    registerFormatter('hoge', (n) => (n === 1n ? 'いち' : 'たくさん'))
    expect(toKan(1, 'hoge')).toBe('いち')
    expect(toKan(4, 'hoge')).toBe('たくさん')
    expect(getFormatter('hoge')).toBeDefined()
  })

  it('throws on unknown formatter names', () => {
    expect(() => toKan(1, 'no_such_formatter')).toThrow(TypeError)
  })

  it('rejects negative and non-integer input', () => {
    expect(() => toKan(-1)).toThrow(RangeError)
    expect(() => toKan(1.5)).toThrow(RangeError)
  })

  it('round-trips random integers through simple formatter', () => {
    for (let i = 0; i < 200; i++) {
      const digits = 1 + Math.floor(Math.random() * 20)
      let n = 0n
      for (let d = 0; d < digits; d++) n = n * 10n + BigInt(Math.floor(Math.random() * 10))
      expect(toBigInt(toKan(n))).toBe(n)
    }
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run test/to-kan.test.ts test/formatter/simple.test.ts`
Expected: FAIL (export が存在しない)

- [ ] **Step 3: src/groups.ts、src/formatter/simple.ts、src/formatters.ts を実装**

`src/groups.ts`:

```ts
import { UNIT_EXP4 } from './constants.js'

// 4桁ごとのグループを上位から返す。ゼロのグループも含む (スキップは各フォーマッタの責務)。
export function groups4(num: bigint): Array<[number, string]> {
  const ret: Array<[number, string]> = []
  for (let i = UNIT_EXP4.length; i >= 0; i--) {
    const unit = i === 0 ? '' : (UNIT_EXP4[i - 1] as string)
    ret.push([Number((num / 10_000n ** BigInt(i)) % 10_000n), unit])
  }
  return ret
}
```

`src/formatter/simple.ts`:

```ts
import { UNIT_EXP3 } from '../constants.js'
import { groups4 } from '../groups.js'

const KAN_DIGITS = '一二三四五六七八九'

export function simple(num: bigint): string {
  if (num === 0n) return '零'
  let ret = ''
  for (const [i4, unit4] of groups4(num)) {
    if (i4 === 0) continue
    if (i4 === 1) {
      ret += `一${unit4}`
      continue
    }
    for (let j = UNIT_EXP3.length; j >= 0; j--) {
      const unit3 = j === 0 ? '' : (UNIT_EXP3[j - 1] as string)
      const i3 = Math.floor(i4 / 10 ** j) % 10
      if (i3 === 0) continue
      ret += i3 === 1 && unit3 !== '' ? unit3 : (KAN_DIGITS[i3 - 1] as string) + unit3
    }
    ret += unit4
  }
  return ret
}
```

`src/formatters.ts`:

```ts
import { simple } from './formatter/simple.js'

export type KansujiFormatterOptions = Record<string, unknown>
export type KansujiFormatter = (num: bigint, options?: KansujiFormatterOptions) => string

const formatters = new Map<string, KansujiFormatter>([['simple', simple]])

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
```

`src/index.ts` に追記:

```ts
export { toBigInt, toNumber } from './parse.js'
export { UNIT_EXP3, UNIT_EXP4 } from './constants.js'
export {
  getFormatter,
  registerFormatter,
  toKan,
  type KansujiFormatter,
  type KansujiFormatterOptions,
} from './formatters.js'
export { simple } from './formatter/simple.js'
export const VERSION = '0.1.0'
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run && npm run typecheck`
Expected: 全件 PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add formatter registry, toKan, and simple formatter"
```

---

### Task 4: 残りの組み込みフォーマッタ (gov / lawyer / judic_v / judic_h)

**推奨モデル:** Sonnet

**Files:**
- Create: `src/formatter/gov.ts`, `src/formatter/lawyer.ts`, `src/formatter/judic.ts`
- Modify: `src/formatters.ts`, `src/index.ts`
- Test: `test/formatter/gov.test.ts`, `test/formatter/lawyer.test.ts`, `test/formatter/judic.test.ts`

**Interfaces:**
- Consumes: `groups4` (Task 3)
- Produces: `gov(num: bigint): string`、`lawyer(num: bigint): string`、`judicV(num: bigint): string`、`judicH(num: bigint): string`。レジストリ初期値に `gov` / `lawyer` / `judic_v` / `judic_h` を追加。

- [ ] **Step 1: 失敗するテストを書く**

期待値はすべて `~/works/git/github/ya_kansuji/spec/ya_kansuji/formatter/*_spec.rb` から転記する。以下は各ファイルの代表ケース (実ファイルには spec の全ケースを移す)。

`test/formatter/gov.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { gov } from '../../src/index.js'

describe('gov formatter', () => {
  it('converts number to government style', () => {
    expect(gov(0n)).toBe('0')
    expect(gov(1n)).toBe('1')
    expect(gov(1234n)).toBe('1234')
    expect(gov(10_003n)).toBe('1万, 3')
    expect(gov(10_010_003n)).toBe('1001万, 3')
    expect(gov(100_000_003n)).toBe('1億, 3')
    expect(gov(200_000_000_056n)).toBe('2000億, 56')
    expect(gov(9_030_000_001_008n)).toBe('9兆, 300億, 1008')
    expect(gov(1_000_100_010_000n)).toBe('1兆, 1億, 1万')
    expect(gov(9_999_999n)).toBe('999万, 9999')
    expect(gov(9n * 10n ** 65n)).toBe('90不可思議')
    expect(gov(10n ** 68n)).toBe('1無量大数')
  })
})
```

`test/formatter/lawyer.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { lawyer } from '../../src/index.js'

describe('lawyer formatter', () => {
  it('converts number to lawyer style', () => {
    expect(lawyer(0n)).toBe('0')
    expect(lawyer(1234n)).toBe('1,234')
    expect(lawyer(10_003n)).toBe('1万3')
    expect(lawyer(10_010_003n)).toBe('1,001万3')
    expect(lawyer(200_000_000_056n)).toBe('2,000億56')
    expect(lawyer(9_030_000_001_008n)).toBe('9兆300億1,008')
    expect(lawyer(9_999_999n)).toBe('999万9,999')
  })
})
```

`test/formatter/judic.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { judicH, judicV } from '../../src/index.js'

describe('judicV formatter', () => {
  it('converts number to judicial kanji style', () => {
    expect(judicV(0n)).toBe('〇')
    expect(judicV(1234n)).toBe('一二三四')
    expect(judicV(10_003n)).toBe('一万〇〇〇三')
    expect(judicV(10_010_003n)).toBe('一〇〇一万〇〇〇三')
    expect(judicV(200_000_000_056n)).toBe('二〇〇〇億〇〇五六')
    expect(judicV(9_030_000_001_008n)).toBe('九兆〇三〇〇億一〇〇八')
    expect(judicV(1_000_100_010_000n)).toBe('一兆〇〇〇一億〇〇〇一万')
  })
})

describe('judicH formatter', () => {
  it('converts number to judicial fullwidth style', () => {
    expect(judicH(0n)).toBe('０')
    expect(judicH(1234n)).toBe('１２３４')
    expect(judicH(10_003n)).toBe('１万０００３')
    expect(judicH(9_030_000_001_008n)).toBe('９兆０３００億１００８')
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run test/formatter/`
Expected: 新規3ファイルが FAIL

- [ ] **Step 3: フォーマッタを実装**

`src/formatter/gov.ts`:

```ts
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
```

`src/formatter/lawyer.ts`:

```ts
import { groups4 } from '../groups.js'

export function lawyer(num: bigint): string {
  if (num === 0n) return '0'
  let ret = ''
  for (const [i4, unit4] of groups4(num)) {
    if (i4 === 0) continue
    const s = String(i4)
    ret += (i4 >= 1000 ? `${s[0]},${s.slice(1)}` : s) + unit4
  }
  return ret
}
```

`src/formatter/judic.ts`:

```ts
import { groups4 } from '../groups.js'

const KAN_DIGITS = '〇一二三四五六七八九'

function judic(num: bigint, zero: string, mapDigits: (s: string) => string): string {
  if (num === 0n) return zero
  let ret = ''
  let head = true
  for (const [i4, unit4] of groups4(num)) {
    if (i4 === 0) continue
    ret += (head ? String(i4) : String(i4).padStart(4, '0')) + unit4
    head = false
  }
  return mapDigits(ret)
}

export function judicV(num: bigint): string {
  return judic(num, '〇', (s) => s.replace(/[0-9]/g, (d) => KAN_DIGITS[Number(d)] as string))
}

export function judicH(num: bigint): string {
  return judic(num, '０', (s) =>
    s.replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0xfee0)),
  )
}
```

`src/formatters.ts` のレジストリ初期値を差し替え:

```ts
import { gov } from './formatter/gov.js'
import { judicH, judicV } from './formatter/judic.js'
import { lawyer } from './formatter/lawyer.js'
import { simple } from './formatter/simple.js'

const formatters = new Map<string, KansujiFormatter>([
  ['simple', simple],
  ['gov', gov],
  ['lawyer', lawyer],
  ['judic_v', judicV],
  ['judic_h', judicH],
])
```

`src/index.ts` に追記:

```ts
export { gov } from './formatter/gov.js'
export { lawyer } from './formatter/lawyer.js'
export { judicH, judicV } from './formatter/judic.js'
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run && npm run typecheck`
Expected: 全件 PASS (Task 3 の既存テスト含む)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add gov, lawyer, judic_v, judic_h formatters"
```

---

### Task 5: 配布検証・README・CI

**推奨モデル:** Sonnet (README の使用例転記部分は Haiku でも可)

**Files:**
- Create: `README.md`, `.github/workflows/ci.yml`
- Test: `test/dist.test.ts` (ビルド成果物の検証)

**Interfaces:**
- Consumes: Task 1 のビルドパイプライン、Task 2-4 の全 API
- Produces: 公開可能なパッケージ (publint / attw クリーン)

- [ ] **Step 1: ビルド成果物の検証テストを書く**

`test/dist.test.ts`:

```ts
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// ビルド済み dist を検証する。CI では build 後に実行される前提。
describe.skipIf(!existsSync('dist/index.cjs'))('dist artifacts', () => {
  it('works via CJS require', () => {
    const out = execFileSync('node', [
      '-e',
      "const k = require('./dist/index.cjs'); console.log(k.toKan(1234))",
    ]).toString().trim()
    expect(out).toBe('千二百三十四')
  })

  it('works via ESM import', () => {
    const out = execFileSync('node', [
      '-e',
      "import('./dist/index.js').then(k => console.log(k.toNumber('千二百三十四')))",
    ]).toString().trim()
    expect(out).toBe('1234')
  })

  it('exposes YaKansuji global via IIFE', () => {
    const out = execFileSync('node', [
      '-e',
      "require('./dist/index.iife.min.js'); console.log(globalThis.YaKansuji.toKan(1234))",
    ]).toString().trim()
    expect(out).toBe('千二百三十四')
  })
})
```

- [ ] **Step 2: ビルドして検証テストを実行**

Run: `npm run build && npx vitest run test/dist.test.ts && npx publint && npx @arethetypeswrong/cli --pack .`
Expected: テスト PASS、publint "All good!"、attw で型解決の警告なし

- [ ] **Step 3: README.md を書く**

Ruby 版 README (`~/works/git/github/ya_kansuji/README.md`) の構成に倣い、日本語で以下を含める:

- 概要 (Ruby 版 ya_kansuji の JS 移植であること、リンク)
- インストール: `npm install ya-kansuji`
- npm/バンドラでの使用例 (`import { toNumber, toKan } from 'ya-kansuji'`)
- CDN での使用例2種:

````markdown
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
````

- 機能一覧・組み込みフォーマッタの出力例 (Ruby 版 README の表を transcribe し、`to_i` → `toNumber`/`toBigInt`、`to_kan` → `toKan` に読み替え)
- Ruby 版との差分3点 (クラス拡張なし / 負数非対応 / BigInt 分割) を明記
- ライセンス (BSD-2-Clause)

- [ ] **Step 4: CI ワークフローを書く**

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ['20', '22', '24']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
      - run: npm test
      - run: npx publint
      - run: npx @arethetypeswrong/cli --pack .
```

package-lock.json をコミットしていることを確認する (`npm ci` の前提)。

- [ ] **Step 5: 全体を最終確認して Commit**

Run: `npm run typecheck && npm run build && npm test`
Expected: 全件 PASS

```bash
git add -A
git commit -m "feat: add dist verification tests, README, and CI workflow"
```

---

## 完了条件

- Ruby 版 spec 由来の全期待値が Vitest で PASS する。
- `npm run build` で ESM / CJS / IIFE / 型定義が生成され、publint と attw が警告なしで通る。
- README に npm と CDN (両方式) の動作する使用例がある。

## この後の作業 (このプランの範囲外)

- GitHub リポジトリ作成と push、npm publish。
- ya-wareki-js の実装計画作成 (設計は `ya-wareki-js/docs/superpowers/specs/2026-07-13-ya-wareki-js-design.md` 済み)。ya-wareki は本パッケージの `toNumber` / `toKan` / `registerFormatter` を使う。
