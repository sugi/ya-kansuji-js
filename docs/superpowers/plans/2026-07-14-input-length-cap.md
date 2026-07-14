# Input-Length Cap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the High-severity uncontrolled-resource-consumption (DoS) finding in `toBigInt`/`toNumber` by capping raw input length, then cut the first stable release (1.0.0).

**Architecture:** Add a single guard at the top of `toBigInt` that rejects inputs longer than `MAX_INPUT_LENGTH` (16384 UTF-16 code units) *before* any cleaning/parsing, throwing `RangeError`. `toNumber` inherits the guard because it delegates to `toBigInt`. The value that parsing can produce stays unbounded — only input *length* is capped. No algorithmic rewrite (the cap makes the O(n²) accumulation trivially bounded).

**Tech Stack:** TypeScript, tsdown (build), vitest (tests). ESM/CJS/IIFE outputs.

## Global Constraints

- `MAX_INPUT_LENGTH` value is exactly `16384` (UTF-16 code units), copied verbatim everywhere.
- The cap is on raw input length (`String(str).length`), checked **before** `clean()`.
- On exceed: throw `RangeError`. Do **not** truncate.
- Do **not** rewrite the digit-accumulation algorithm.
- `MAX_INPUT_LENGTH` is a public export (from `src/index.ts`).
- Node `>=16`, no runtime dependencies (unchanged).
- Commit message trailers (append to every commit body):
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01W1zPrEAZrw1oa3qFMPtPhK
  ```

---

### Task 1: Input-length guard + tests

**Files:**
- Modify: `src/parse.ts` (add `MAX_INPUT_LENGTH` constant; add guard + JSDoc in `toBigInt`; extend `toNumber` JSDoc)
- Modify: `src/index.ts:1` (re-export `MAX_INPUT_LENGTH`)
- Test: `test/parse.test.ts` (new `describe` block; extend the existing import)

**Interfaces:**
- Consumes: existing `toBigInt(str: string): bigint`, `toNumber(str: string): number` from `src/parse.ts`.
- Produces:
  - `export const MAX_INPUT_LENGTH = 16384` from `src/parse.ts`, re-exported by `src/index.ts`.
  - `toBigInt` / `toNumber` now throw `RangeError` when `String(str).length > MAX_INPUT_LENGTH`.

- [ ] **Step 1: Write the failing tests**

Add `MAX_INPUT_LENGTH` to the existing import at the top of `test/parse.test.ts`:

```ts
import { MAX_INPUT_LENGTH, toBigInt, toNumber } from '../src/index.js'
```

Append this `describe` block at the end of `test/parse.test.ts` (after the `toBigInt` block, before EOF):

```ts
describe('input length guard', () => {
  it('exposes the cap as a public constant', () => {
    expect(MAX_INPUT_LENGTH).toBe(16384)
  })

  it('accepts input of exactly MAX_INPUT_LENGTH', () => {
    expect(() => toBigInt('一'.repeat(MAX_INPUT_LENGTH))).not.toThrow()
  })

  it('throws RangeError when input exceeds MAX_INPUT_LENGTH', () => {
    expect(() => toBigInt('一'.repeat(MAX_INPUT_LENGTH + 1))).toThrow(RangeError)
  })

  it('makes toNumber reject over-length input too', () => {
    expect(() => toNumber('1'.repeat(MAX_INPUT_LENGTH + 1))).toThrow(RangeError)
  })

  // Regression guard: without the cap, parsing 1,000,000 digits is ~100s (O(n^2)),
  // which would blow the per-test timeout. The guard rejects in O(1) before any
  // accumulation, so this completes in well under 1s.
  it('rejects a large adversarial digit run promptly', () => {
    expect(() => toBigInt('1'.repeat(1_000_000))).toThrow(RangeError)
  }, 1000)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/parse.test.ts`
Expected: FAIL — `MAX_INPUT_LENGTH` is `undefined` (not exported yet), so the constant assertion fails and the over-length cases do not throw.

- [ ] **Step 3: Add the constant and export it**

In `src/parse.ts`, add the exported constant immediately after the `MAX_SAFE_BIGINT` line (currently `const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)`):

```ts
/** toBigInt / toNumber が受け付ける入力の最大長（UTF-16 コードユニット数）。 */
export const MAX_INPUT_LENGTH = 16384
```

In `src/index.ts`, change line 1 from:

```ts
export { toBigInt, toNumber } from './parse.js'
```

to:

```ts
export { MAX_INPUT_LENGTH, toBigInt, toNumber } from './parse.js'
```

- [ ] **Step 4: Add the guard in `toBigInt` and update JSDoc**

In `src/parse.ts`, add one line to the `toBigInt` JSDoc block — insert this line right before the `@param str` line:

```
 * 入力長が {@link MAX_INPUT_LENGTH} を超える場合は `RangeError` を投げる。
```

and add this line right before the `@example` line:

```
 * @throws {RangeError} 入力長が {@link MAX_INPUT_LENGTH} を超える場合
```

Then replace the opening of `toBigInt`. Change:

```ts
export function toBigInt(str: string): bigint {
  const cleaned = clean(String(str))
```

to:

```ts
export function toBigInt(str: string): bigint {
  const s = String(str)
  if (s.length > MAX_INPUT_LENGTH) {
    throw new RangeError(`kansuji input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`)
  }
  const cleaned = clean(s)
```

In the `toNumber` JSDoc block, add a second `@throws` line right after the existing `@throws {RangeError} 値が安全整数の範囲を超える場合` line:

```
 * @throws {RangeError} 入力長が {@link MAX_INPUT_LENGTH} を超える場合
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run test/parse.test.ts`
Expected: PASS — all cases in the `input length guard` block green, and all pre-existing `toNumber`/`toBigInt` cases still green.

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: PASS (all files; note `dist.test.ts` uses the previously-built `dist/` — it should still pass since exports are additive).

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/parse.ts src/index.ts test/parse.test.ts
git commit -m "$(cat <<'EOF'
fix!: cap toBigInt/toNumber input length to prevent DoS

Adds MAX_INPUT_LENGTH (16384 UTF-16 code units) and rejects longer input
with a RangeError before any cleaning/parsing, closing the High-severity
uncontrolled-resource-consumption finding (quadratic bigint accumulation
on unbounded digit runs). toNumber inherits the guard. The produced value
stays unbounded; only input length is capped. toBigInt now throws where it
previously never did — intentional for the 0.1.0 -> 1.0.0 bump.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01W1zPrEAZrw1oa3qFMPtPhK
EOF
)"
```

---

### Task 2: Documentation + 1.0.0 release metadata

**Files:**
- Modify: `package.json:2` (version `0.1.0` → `1.0.0`)
- Modify: `CHANGELOG.md` (add `[1.0.0]` section + compare links)
- Modify: `README.md` (document the cap; bump CDN example URLs `@0.1.0` → `@1.0.0`)

**Interfaces:**
- Consumes: `MAX_INPUT_LENGTH` export from Task 1 (referenced in README prose/example).
- Produces: released 1.0.0 metadata and user-facing docs for the cap.

- [ ] **Step 1: Bump the package version**

In `package.json`, change:

```json
  "version": "0.1.0",
```

to:

```json
  "version": "1.0.0",
```

- [ ] **Step 2: Update the changelog**

In `CHANGELOG.md`, replace the current:

```markdown
## [Unreleased]

## [0.1.0] - 2026-07-14
```

with:

```markdown
## [Unreleased]

## [1.0.0] - 2026-07-14

### Security

- `toBigInt` / `toNumber` に入力長の上限 `MAX_INPUT_LENGTH`（16384 コードユニット）を導入。
  過大な入力によるリソース枯渇（DoS）を防ぐため、上限超過時は `RangeError` を投げる。
  値そのものに上限はなく、上限が掛かるのは入力の長さのみ。
  従来 `toBigInt` は例外を投げなかったが、過長入力に対しては投げるようになった（破壊的変更）。

### Added

- `MAX_INPUT_LENGTH` を公開エクスポートに追加。

## [0.1.0] - 2026-07-14
```

Then replace the link-reference block at the bottom of `CHANGELOG.md`:

```markdown
[Unreleased]: https://github.com/sugi/ya-kansuji-js/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sugi/ya-kansuji-js/releases/tag/v0.1.0
```

with:

```markdown
[Unreleased]: https://github.com/sugi/ya-kansuji-js/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/sugi/ya-kansuji-js/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/sugi/ya-kansuji-js/releases/tag/v0.1.0
```

- [ ] **Step 3: Document the cap in the README**

In `README.md`, locate the reading section. Right after the closing ```` ``` ```` of the `toBigInt('一無量大数')` / `toNumber('一無量大数')` example (the block that ends just before the "先頭の「マイナス」…" paragraph), insert this new subsection:

```markdown
#### 入力長の上限

`toBigInt` / `toNumber` が受け付ける入力は最大 `MAX_INPUT_LENGTH`（16384 コードユニット）です。これを超える入力には `RangeError` を投げます。上限は入力文字列の**長さ**に対するもので、変換後の**値**に上限はありません（無量大数を超える大きさも扱えます）。この上限により、任意長テキストを渡してもパースの最悪計算コストが有界になります。

​```ts
import { MAX_INPUT_LENGTH, toBigInt } from 'ya-kansuji'

MAX_INPUT_LENGTH                            // => 16384
toBigInt('一'.repeat(MAX_INPUT_LENGTH))     // OK
toBigInt('一'.repeat(MAX_INPUT_LENGTH + 1)) // throws RangeError
​```
```

(Note: the two `​```` fences above contain a zero-width joiner only to escape them inside this plan — when editing `README.md`, use plain ```` ``` ```` code fences with the `ts` language tag.)

Then update the two CDN example URLs in the "CDN での使用" section: change `ya-kansuji@0.1.0` → `ya-kansuji@1.0.0` in the `<script src=...>` line, and `ya-kansuji@0.1.0/+esm` → `ya-kansuji@1.0.0/+esm` in the ES Modules example.

- [ ] **Step 4: Build and run the full suite**

Run: `npm test`
Expected: PASS. (`npm test` runs `pretest` = `tsdown`, rebuilding `dist/` from the Task 1 source, then vitest. `dist.test.ts` validates the freshly built CJS/ESM/IIFE artifacts.)

- [ ] **Step 5: Verify the version is consistent**

Run: `node -e "console.log(require('./package.json').version)"`
Expected output: `1.0.0`

- [ ] **Step 6: Commit**

```bash
git add package.json CHANGELOG.md README.md
git commit -m "$(cat <<'EOF'
chore(release): 1.0.0

Document MAX_INPUT_LENGTH and the RangeError contract, add the 1.0.0
changelog entry, bump CDN example URLs, and set the package version to
1.0.0 (first stable release, includes the input-length DoS hardening).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01W1zPrEAZrw1oa3qFMPtPhK
EOF
)"
```

---

## Post-implementation (not tasks — for the driver)

- Tagging/publishing (`git tag v1.0.0`, `npm publish`) is **out of scope** for this plan; surface to the maintainer.
- Optional: re-run a benchmark to confirm oversized inputs are rejected promptly (report retest step).
