#!/usr/bin/env node
// Erzeugt die Vorschaubilder für das README aus tokens.css:
//   preview/palette.svg  die Kernfarben, hell und dunkel, mit einem Mini-Beispiel
//   preview/tokens.svg   JEDE Farbvariable: Name | hell | dunkel
//
//   node scripts/preview.mjs           # schreiben
//   node scripts/preview.mjs --check   # Exit 1, wenn die Bilder nicht zu tokens.css passen
//
// SVG statt Markdown-Tabelle: GitHub entfernt Inline-Styles aus Markdown, eine
// Farbfläche lässt sich dort nicht anders zeigen. Die Bilder sind erzeugt und
// eingecheckt — `npm run check` (und damit CI) schlägt fehl, wenn jemand
// tokens.css ändert und `npm run preview` vergisst.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const root = new URL('..', import.meta.url)
const css = readFileSync(new URL('tokens.css', root), 'utf8')

// ── parse ─────────────────────────────────────────────────────────────────────
const region = css.slice(css.indexOf('/* BEGIN tokens'), css.indexOf('/* END tokens */')).replace(/\/\*[\s\S]*?\*\//g, '')
const blocks = [...region.matchAll(/(:root(?:\[data-theme='dark'\])?)\s*\{([^}]*)\}/g)].map(m => ({
  selector: m[1],
  vars: Object.fromEntries([...m[2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(v => [v[1], v[2].trim().replace(/\s+/g, ' ')])),
}))
const light = Object.assign({}, ...blocks.filter(b => b.selector === ':root').map(b => b.vars))
const darkOnly = blocks.find(b => b.selector !== ':root')?.vars ?? {}
const dark = { ...light, ...darkOnly }
const isColor = v => /^#[0-9a-f]{3,8}$/i.test(v) || /^rgba?\(/i.test(v)
const colorNames = Object.keys(light).filter(n => isColor(light[n]))

// ── svg helpers ───────────────────────────────────────────────────────────────
const FONT = "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif"
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const text = (x, y, s, { size = 12, fill, weight = 400, mono = false, anchor = 'start' } = {}) =>
  `<text x="${x}" y="${y}" font-family="${esc(mono ? MONO : FONT)}" font-size="${size}" font-weight="${weight}" fill="${esc(fill)}" text-anchor="${anchor}">${esc(s)}</text>`
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${esc(fill)}" ${extra}/>`
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">\n${body.join('\n')}\n</svg>\n`

// ── palette.svg ───────────────────────────────────────────────────────────────
const KEY = [
  ['--primary', 'Primär'], ['--brand', 'Marke'], ['--text', 'Text'], ['--text-muted', 'Text gedämpft'],
  ['--bg', 'Hintergrund'], ['--surface', 'Fläche'], ['--border', 'Rahmen'], ['--accent', 'Akzent'],
  ['--success', 'Erfolg'], ['--warning', 'Warnung'], ['--danger', 'Gefahr'], ['--info', 'Info'],
]
function panel(x, t, title) {
  const W = 440, out = []
  out.push(rect(x, 0, W, 470, t['--bg']))
  out.push(text(x + 24, 36, title, { size: 13, weight: 600, fill: t['--text-muted'] }))
  // Mini-Beispiel: Karte mit Überschrift, Text, Button, Markenstrich
  out.push(rect(x + 24, 52, W - 48, 118, t['--surface'], `stroke="${esc(t['--border'])}" stroke-width="1"`))
  out.push(text(x + 44, 84, 'Cloud-Server', { size: 18, weight: 700, fill: t['--text-heading'] }))
  out.push(rect(x + 44, 94, 36, 1.5, t['--brand']))
  out.push(text(x + 44, 118, 'Stundengenau abgerechnet, mit Monatsdeckel.', { size: 13, fill: t['--text-muted'] }))
  out.push(rect(x + 44, 132, 112, 28, t['--primary']))
  out.push(text(x + 100, 150, 'Bestellen', { size: 13, weight: 600, fill: t['--on-primary'], anchor: 'middle' }))
  out.push(rect(x + 168, 132, 90, 28, t['--primary-soft']))
  out.push(text(x + 213, 150, 'Details', { size: 13, weight: 600, fill: t['--primary-strong'], anchor: 'middle' }))
  // Swatches 4 × 3
  KEY.forEach(([name, label], i) => {
    const cx = x + 24 + (i % 4) * 100, cy = 190 + Math.floor(i / 4) * 92
    out.push(rect(cx, cy, 88, 44, t[name], `stroke="${esc(t['--border-subtle'])}" stroke-width="1"`))
    out.push(text(cx, cy + 60, label, { size: 11, weight: 600, fill: t['--text'] }))
    out.push(text(cx, cy + 74, t[name], { size: 10, mono: true, fill: t['--text-subtle'] }))
  })
  return out
}
const palette = svg(880, 470, [...panel(0, light, 'HELL'), ...panel(440, dark, 'DUNKEL — data-theme="dark"')])

// ── tokens.svg ────────────────────────────────────────────────────────────────
const ROW = 24, HEAD = 40, W = 880
const body = []
body.push(rect(0, 0, W, HEAD + colorNames.length * ROW + 12, light['--surface']))
body.push(rect(360, 0, 260, HEAD + colorNames.length * ROW + 12, light['--bg']))
body.push(rect(620, 0, 260, HEAD + colorNames.length * ROW + 12, dark['--bg']))
body.push(text(16, 26, 'Variable', { size: 12, weight: 700, fill: light['--text'] }))
body.push(text(376, 26, 'hell', { size: 12, weight: 700, fill: light['--text'] }))
body.push(text(636, 26, 'dunkel', { size: 12, weight: 700, fill: dark['--text'] }))
colorNames.forEach((n, i) => {
  const y = HEAD + i * ROW
  if (i % 2) body.push(rect(0, y, 360, ROW, light['--surface-muted']))
  body.push(text(16, y + 16, n, { size: 12, mono: true, fill: light['--text'] }))
  for (const [x, t, same] of [[376, light, false], [636, dark, !(n in darkOnly)]]) {
    body.push(rect(x, y + 4, 28, 16, t[n], `stroke="${esc(t['--border'])}" stroke-width="1"`))
    body.push(text(x + 38, y + 16, same ? `${t[n]}  (wie hell)` : t[n], { size: 11, mono: true, fill: t['--text-muted'] }))
  }
})
const tokens = svg(W, HEAD + colorNames.length * ROW + 12, body)

// ── write / check ─────────────────────────────────────────────────────────────
const files = { 'preview/palette.svg': palette, 'preview/tokens.svg': tokens }
if (process.argv.includes('--check')) {
  const stale = Object.entries(files).filter(([f, s]) => !existsSync(new URL(f, root)) || readFileSync(new URL(f, root), 'utf8') !== s)
  if (stale.length) {
    console.error(`✗ ${stale.map(([f]) => f).join(', ')} passt nicht zu tokens.css — npm run preview`)
    process.exit(1)
  }
  console.log(`preview: ok (${colorNames.length} Farbvariablen)`)
} else {
  for (const [f, s] of Object.entries(files)) writeFileSync(new URL(f, root), s)
  console.log(`preview: geschrieben (${colorNames.length} Farbvariablen)`)
}
