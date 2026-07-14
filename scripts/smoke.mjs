// Exercises the built dist (ESM + CJS) with plain node, no test runner.
// Used by CI to verify the published artifact runs on the oldest supported
// Node (engines.node), where the dev toolchain (tsdown/vitest) cannot run.
import { createRequire } from 'node:module'
import * as esm from '../dist/index.js'

const require = createRequire(import.meta.url)
const cjs = require('../dist/index.cjs')

let failed = false
function check(label, actual, expected) {
  if (actual === expected) {
    console.log(`ok   ${label} => ${actual}`)
  } else {
    console.error(`FAIL ${label}: got ${actual}, expected ${expected}`)
    failed = true
  }
}

for (const [flavor, m] of [['esm', esm], ['cjs', cjs]]) {
  check(`${flavor} toNumber`, m.toNumber('一〇二四'), 1024)
  check(`${flavor} toBigInt`, m.toBigInt('一無量大数'), 10n ** 68n)
  check(`${flavor} toKan`, m.toKan(12345), '一万二千三百四十五')
  check(`${flavor} toKan gov`, m.toKan(10003, 'gov'), '1万, 3')
}

process.exit(failed ? 1 : 0)
