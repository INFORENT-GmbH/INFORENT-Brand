#!/usr/bin/env node
// brand-lint — checks that a consumer (portal, website) takes its design values
// from @inforent/brand instead of writing its own. Ships with the package, so the
// rules are versioned with the brand: a new rule reaches both projects with the
// next version bump.
//
//   brand-lint [options] <path>...
//
//   --ignore <path>        skip a file or directory (repeatable)
//   --baseline <file>      ratchet: existing findings per file/rule are allowed,
//                          only MORE than recorded fails (for a large codebase
//                          that cannot be cleaned in one go)
//   --write-baseline       record the current findings in --baseline and exit 0
//
// Rules (docs: README.md "brand-lint"):
//   color      hex / rgb() / hsl() literal — use var(--…) or `vars.*`
//   gradient   linear/radial/conic-gradient — the brand has no gradients
//   radius     a border radius other than 0 or a var(--radius-*) — the brand is square
//   font       a literal font-family — use var(--ui-font) / var(--mono-font)
//   font-cdn   fonts from a CDN (Google Fonts, Typekit …) — self-host via @fontsource
//   unknown-var  var(--x) where --x is neither a brand variable nor declared in
//                the scanned sources — a typo or a variable a new version removed
//
// A justified exception is marked in the source with its reason: a comment
// `brand-allow: <reason>` on the same line or the line directly above, or a block
// `brand-allow-start: <reason>` … `brand-allow-end` (a chart palette, a canvas
// drawing, a third-party mark). Without a reason the marker does not count.
// Regions between `BEGIN tokens`/`END tokens` and `BEGIN base`/`END base`
// markers are generated copies of the brand and are skipped.

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BRAND_DIR = fileURLToPath(new URL('..', import.meta.url))
const EXTS = new Set(['.css', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.html'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage'])

// ── args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const ignores = []
const paths = []
let baselineFile = null
let writeBaseline = false
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--ignore') ignores.push(resolve(args[++i]))
  else if (a === '--baseline') baselineFile = resolve(args[++i])
  else if (a === '--write-baseline') writeBaseline = true
  else if (a === '-h' || a === '--help') { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 30).join('\n')); process.exit(0) }
  else paths.push(resolve(a))
}
if (!paths.length) { console.error('brand-lint: keine Pfade angegeben (brand-lint --help)'); process.exit(2) }
if (writeBaseline && !baselineFile) { console.error('brand-lint: --write-baseline braucht --baseline <datei>'); process.exit(2) }

// ── brand variable names ──────────────────────────────────────────────────────
const tokens = readFileSync(join(BRAND_DIR, 'tokens.css'), 'utf8')
const tokensClean = tokens.replace(/\/\*[\s\S]*?\*\//g, '')
const brandNames = new Set([...tokensClean.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m => m[1]))
// Hex values the brand itself uses — allowed only where var() cannot work
// (<meta name="theme-color">, a web manifest), and there they must be one of these.
const brandHex = new Set([...tokensClean.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m => m[0].toLowerCase()))

// ── files ─────────────────────────────────────────────────────────────────────
const isIgnored = p => ignores.some(ig => p === ig || p.startsWith(ig + '/'))
function walk(p, out) {
  if (isIgnored(p) || !existsSync(p)) return out
  const st = statSync(p)
  if (st.isDirectory()) {
    for (const e of readdirSync(p)) if (!SKIP_DIRS.has(e)) walk(join(p, e), out)
  } else if (EXTS.has(extname(p)) && !p.endsWith('.d.ts')) out.push(p)
  return out
}
const files = [...new Set(paths.flatMap(p => walk(p, [])))].sort()

/** Source with generated brand regions and comments blanked (line numbers kept). */
function prepare(src) {
  const blank = s => s.replace(/[^\n]/g, ' ')
  let out = src
  for (const [b, e] of [['/* BEGIN tokens', '/* END tokens */'], ['/* BEGIN base', '/* END base */']]) {
    const bi = out.indexOf(b)
    const ei = out.indexOf(e, bi)
    if (bi >= 0 && ei > bi) out = out.slice(0, bi) + blank(out.slice(bi, ei)) + out.slice(ei)
  }
  // Comments are prose: a hex in "was #ed1c24 before" is not a colour in use.
  // `brand-allow` lines are detected on the raw source, before this.
  out = out.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/<!--[\s\S]*?-->/g, blank)
  out = out.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, pre) => pre + blank(m.slice(pre.length)))
  return out
}

// Declared custom properties anywhere in the scanned sources ("--x:" in CSS,
// '--x' as an object key / setProperty argument in TS) — local variables are fine.
const declared = new Set()
const sources = new Map()
for (const f of files) {
  const raw = readFileSync(f, 'utf8')
  sources.set(f, raw)
  for (const m of raw.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) declared.add(m[1])
  for (const m of raw.matchAll(/['"`](--[a-zA-Z0-9-]+)['"`]/g)) declared.add(m[1])
}

// ── rules ─────────────────────────────────────────────────────────────────────
const ZERO = /^\s*['"]?\s*0(px|rem|em|%)?\s*['"]?\s*$/
const RULES = [
  {
    id: 'color',
    re: /(?<![\w&#/-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(\s*[\d.]/g,
    test: (m, line) => !(/theme-color|theme_color|background_color/.test(line) && brandHex.has(m[0].toLowerCase())),
    msg: 'Farbwert direkt im Code — var(--…) bzw. vars.* aus @inforent/brand nutzen',
  },
  {
    id: 'gradient',
    re: /\b(?:repeating-)?(?:linear|radial|conic)-gradient\(/g,
    msg: 'Verlauf — die Brand hat keine Verläufe',
  },
  {
    id: 'radius',
    re: /\bborder(?:-[a-z]+)?-radius\s*:\s*([^;}\n]+)|\bborder\w*Radius\s*:\s*([^,}\n]+)/g,
    test: m => {
      const v = (m[1] ?? m[2]).trim()
      if (ZERO.test(v)) return false
      if (/var\(--radius-/.test(v) || /\bradius\.\w+|\bvars\.radius\w*/.test(v)) return false
      if (/^(inherit|initial|unset|revert)$/.test(v.replace(/['";]/g, '').trim())) return false
      // Anything else a literal number or length is a finding; a bare identifier
      // (a prop, a helper) cannot be judged here and passes.
      return /\d/.test(v) && !/^[A-Za-z_$][\w$.]*\s*$/.test(v)
    },
    msg: 'eigener Eckenradius — die Brand ist eckig: 0 oder var(--radius-*)',
  },
  {
    // A local radius scale (`const radius = { sm: 4, md: 8 }`) hides its numbers
    // from the rule above — every `borderRadius: radius.md` looks clean.
    id: 'radius',
    re: /\b(?:const|let|var)\s+radius\w*\s*=\s*\{([^}]*)\}/g,
    test: m => /:\s*['"`]?[1-9]/.test(m[1]),
    msg: 'eigene Radius-Skala — Werte aus der Brand nehmen: var(--radius-*) bzw. vars.radius*',
  },
  {
    id: 'font',
    re: /\bfont-family\s*:\s*([^;}\n]+)|\bfontFamily\s*:\s*(['"`][^'"`]*['"`])/g,
    test: m => {
      const v = (m[1] ?? m[2]).trim().replace(/^['"`]|['"`]$/g, '')
      return !/^(var\(--(ui|mono)-font\s*[,)]|inherit|initial|unset|revert)/.test(v)
    },
    msg: 'Schriftfamilie direkt im Code — var(--ui-font) / var(--mono-font) nutzen',
  },
  {
    id: 'font-cdn',
    re: /fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net|fast\.fonts\.net/g,
    raw: true,
    msg: 'Schriften vom CDN — selbst hosten (@fontsource)',
  },
  {
    id: 'unknown-var',
    re: /var\(\s*(--[a-zA-Z0-9-]+)/g,
    test: m => !brandNames.has(m[1]) && !declared.has(m[1]),
    msg: m => `${m[1]} ist weder eine Brand-Variable noch im Projekt deklariert`,
  },
]

// ── scan ──────────────────────────────────────────────────────────────────────
const findings = []
for (const f of files) {
  const raw = sources.get(f)
  const clean = prepare(raw)
  const rawLines = raw.split('\n')
  const lineStarts = [0]
  for (let i = 0; i < clean.length; i++) if (clean[i] === '\n') lineStarts.push(i + 1)
  const lineOf = idx => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1 } return lo }
  // Exceptions need a reason: `brand-allow: <reason>` on the line or the line
  // above, or a block `brand-allow-start: <reason>` … `brand-allow-end`.
  const ALLOW = /brand-allow:\s*\S/
  const inBlock = new Set()
  for (let i = 0, open = false; i < rawLines.length; i++) {
    if (/brand-allow-start:\s*\S/.test(rawLines[i])) open = true
    if (open) inBlock.add(i)
    if (/brand-allow-end/.test(rawLines[i])) open = false
  }
  const allowed = l => inBlock.has(l) || ALLOW.test(rawLines[l] ?? '') || ALLOW.test(rawLines[l - 1] ?? '')
  for (const rule of RULES) {
    const text = rule.raw ? raw : clean
    for (const m of text.matchAll(rule.re)) {
      const line = lineOf(m.index)
      if (rule.test && !rule.test(m, rawLines[line] ?? '')) continue
      if (allowed(line)) continue
      findings.push({
        file: relative(process.cwd(), f),
        line: line + 1,
        rule: rule.id,
        msg: typeof rule.msg === 'function' ? rule.msg(m) : rule.msg,
        text: rawLines[line].trim().slice(0, 120),
      })
    }
  }
}

// ── report ────────────────────────────────────────────────────────────────────
const count = {}
for (const x of findings) ((count[x.file] ??= {})[x.rule] = (count[x.file]?.[x.rule] ?? 0) + 1)

if (writeBaseline) {
  const sorted = Object.fromEntries(Object.keys(count).sort().map(k => [k, count[k]]))
  writeFileSync(baselineFile, JSON.stringify(sorted, null, 2) + '\n')
  console.log(`brand-lint: Baseline geschrieben (${findings.length} Befunde in ${Object.keys(count).length} Dateien) → ${relative(process.cwd(), baselineFile)}`)
  process.exit(0)
}

const baseline = baselineFile && existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, 'utf8')) : {}
let failed = 0
let lowered = 0
for (const [file, rules] of Object.entries(count)) {
  for (const [rule, n] of Object.entries(rules)) {
    const allowed = baseline[file]?.[rule] ?? 0
    if (n > allowed) {
      failed += n - allowed
      for (const x of findings.filter(y => y.file === file && y.rule === rule)) {
        console.error(`✗ ${x.file}:${x.line}  [${x.rule}] ${x.msg}\n    ${x.text}`)
      }
      if (allowed) console.error(`  (${file} [${rule}]: ${n} Befunde, Baseline erlaubt ${allowed})`)
    }
  }
}
for (const [file, rules] of Object.entries(baseline)) {
  for (const [rule, n] of Object.entries(rules)) if ((count[file]?.[rule] ?? 0) < n) lowered++
}

if (failed) {
  console.error(`\nbrand-lint: ${failed} neue Abweichung(en) von @inforent/brand. Werte aus der Brand nehmen; begründete Ausnahme: Kommentar "brand-allow: <Grund>" in der Zeile.`)
  process.exit(1)
}
console.log(`brand-lint: ok (${files.length} Dateien${baselineFile ? `, ${findings.length} Befunde in der Baseline` : ''})`)
if (lowered) console.log(`brand-lint: ${lowered} Baseline-Einträge sind abgebaut — mit --write-baseline festschreiben, damit die Ratsche greift.`)
