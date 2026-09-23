#!/usr/bin/env node
// Prüft, was die Verbraucher voraussetzen — dieselben Regeln, an denen
// web/scripts/tokens-sync.mjs im Portal sonst erst beim Update scheitern würde:
//   • genau ein BEGIN- und ein END-Marker, in dieser Reihenfolge
//   • dazwischen genau drei Regeln: :root (Geometrie), :root (hell), :root[data-theme='dark']
//   • logo.png ist ein PNG
//   • die Version in package.json passt zum Git-Tag (nur im Release-Lauf, via RELEASE_TAG)

import { readFileSync } from 'node:fs'

const fail = m => { console.error(`✗ ${m}`); process.exit(1) }
const css = readFileSync(new URL('../tokens.css', import.meta.url), 'utf8')

const BEGIN = '/* BEGIN tokens', END = '/* END tokens */'
if (css.split(BEGIN).length !== 2 || css.split(END).length !== 2) fail('tokens.css: genau ein BEGIN- und ein END-Marker erwartet')
const b = css.indexOf(BEGIN), e = css.indexOf(END)
if (e < b) fail('tokens.css: END vor BEGIN')

const region = css.slice(css.indexOf('*/', b) + 2, e).replace(/\/\*[\s\S]*?\*\//g, '')
const selectors = []
let depth = 0, buf = ''
for (const ch of region) {
  if (ch === '{') { if (depth === 0) selectors.push(buf.trim()); depth++; buf = '' }
  else if (ch === '}') { depth--; buf = '' }
  else if (depth === 0) buf += ch
}
if (depth !== 0) fail('tokens.css: Klammern nicht ausgeglichen')
const expected = [':root', ':root', ":root[data-theme='dark']"]
if (JSON.stringify(selectors) !== JSON.stringify(expected)) {
  fail(`tokens.css: zwischen den Markern stehen ${JSON.stringify(selectors)}, erwartet ${JSON.stringify(expected)}`)
}
if (css.slice(e + END.length).trim() !== '') fail('tokens.css: nach END tokens darf nichts mehr stehen')

const png = readFileSync(new URL('../logo.png', import.meta.url))
if (!png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) fail('logo.png ist kein PNG')

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const tag = process.env.RELEASE_TAG
if (tag && tag !== `v${version}`) fail(`Tag ${tag} passt nicht zu package.json-Version ${version}`)

const names = new Set(css.match(/--[a-z0-9-]+(?=\s*:)/g))
console.log(`brand check: ok (${names.size} Variablen, Version ${version})`)
