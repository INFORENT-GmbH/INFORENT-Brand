#!/usr/bin/env node
// Erzeugt den Styleguide für brand.inforent.com aus tokens.css:
//   site-dist/index.html   die Seite (eine Datei, kein Framework)
//   site-dist/assets/      tokens.css, base.css, logo.png, Schriften
//
//   node scripts/site.mjs
//
// Die Seite ist für Menschen — Chef, Agenturen, wer eine Drucksache oder eine
// Präsentation baut. Portal und Website beziehen das Paket weiter über das
// GitHub-Release (README); nichts hier ist eine eingebundene Adresse, auf die
// sich ein Projekt verlassen darf. Deshalb keine Versionsordner.
//
// Wie preview.mjs liest das Skript tokens.css selbst: eine neue Variable steht
// nach dem nächsten Deploy ohne Handarbeit auf der Seite.

import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs'

const root = new URL('..', import.meta.url)
const out = new URL('site-dist/', root)
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
const css = readFileSync(new URL('tokens.css', root), 'utf8')

// ── parse (dieselbe Logik wie preview.mjs) ────────────────────────────────────
const region = css.slice(css.indexOf('/* BEGIN tokens'), css.indexOf('/* END tokens */')).replace(/\/\*[\s\S]*?\*\//g, '')
const blocks = [...region.matchAll(/(:root(?:\[data-theme='dark'\])?)\s*\{([^}]*)\}/g)].map(m => ({
  selector: m[1],
  vars: Object.fromEntries([...m[2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(v => [v[1], v[2].trim().replace(/\s+/g, ' ')])),
}))
const light = Object.assign({}, ...blocks.filter(b => b.selector === ':root').map(b => b.vars))
const dark = { ...light, ...(blocks.find(b => b.selector !== ':root')?.vars ?? {}) }
const isColor = v => /^#[0-9a-f]{3,8}$/i.test(v) || /^rgba?\(/i.test(v)
const colorNames = Object.keys(light).filter(n => isColor(light[n]))
const names = prefix => Object.keys(light).filter(n => n.startsWith(prefix))
const px = rem => (/rem$/.test(rem) ? `${Math.round(parseFloat(rem) * 16 * 100) / 100} px` : rem)

// ── html helpers ──────────────────────────────────────────────────────────────
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const code = s => `<code>${esc(s)}</code>`
const section = (id, title, lead, body) =>
  `<section id="${id}"><h2>${esc(title)}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}${body}</section>`

// Kernfarben mit Rolle — die Bedeutung, nicht nur der Wert (docs/areas/brand.md §1).
const CORE = [
  ['--primary', 'Primär', 'Hauptaktion, Links, aktive Navigation, Fokusrahmen.'],
  ['--brand', 'INFORENT-Rot', 'Die Marke: der kurze Strich unter der Wortmarke, Aufzählungspunkte. Nie Button-Fläche, nie Text unter ~24 px.'],
  ['--text', 'Text', 'Fließtext.'],
  ['--text-heading', 'Überschrift', 'Überschriften.'],
  ['--text-muted', 'Text gedämpft', 'Beschriftungen, Nebentext (7,6 : 1).'],
  ['--bg', 'Hintergrund', 'Seiten- und App-Hintergrund.'],
  ['--surface', 'Fläche', 'Karten, Eingabefelder.'],
  ['--border', 'Rahmen', 'Standardrahmen — er trägt die Tiefe, nicht der Schatten.'],
  ['--success', 'Erfolg', 'Bestätigt, läuft.'],
  ['--warning', 'Warnung', 'Achtung, bald fällig.'],
  ['--danger', 'Gefahr', 'Fehler, Löschen.'],
  ['--info', 'Info', 'Hinweise.'],
  ['--admin', 'Admin-Violett', 'Nur für Administratoren sichtbar — eingeschränkt, nicht gefährlich.'],
  ['--accent', 'Akzent', 'Zweite Datenreihe, Etiketten.'],
]

const swatch = (value, label) =>
  `<div class="sw"><span class="chip" style="background:${esc(value)}"></span><span class="hex">${esc(label ?? value)}</span></div>`

const coreGrid = CORE.map(([n, title, role]) => `
  <div class="core">
    <div class="pair">${swatch(light[n], `hell ${light[n]}`)}${swatch(dark[n], `dunkel ${dark[n]}`)}</div>
    <strong>${esc(title)}</strong> ${code(n)}
    <p>${esc(role)}</p>
  </div>`).join('')

const allColors = `<table class="grid"><thead><tr><th>Variable</th><th>Hell</th><th>Dunkel</th></tr></thead><tbody>${
  colorNames.map(n => `<tr><td>${code(n)}</td><td>${swatch(light[n])}</td><td>${swatch(dark[n])}</td></tr>`).join('')
}</tbody></table>`

const typeScale = names('--font-').map(n =>
  `<tr><td>${code(n)}</td><td>${px(light[n])}</td><td><span style="font-size:var(${n})">Rechenzentrum Frankfurt</span></td></tr>`).join('')
const leading = names('--leading-').map(n => `<tr><td>${code(n)}</td><td>${esc(light[n])}</td></tr>`).join('')
const spacing = names('--space-').map(n =>
  `<tr><td>${code(n)}</td><td>${px(light[n])}</td><td><span class="bar" style="width:var(${n})"></span></td></tr>`).join('')
const radii = names('--radius-').map(n =>
  `<div class="box" style="border-radius:var(${n})"><span>${code(n)}<br>${esc(light[n])}</span></div>`).join('')
const shadows = names('--shadow-').map(n =>
  `<div class="box shadowbox" style="box-shadow:var(${n})"><span>${code(n)}</span></div>`).join('')
const motion = names('--dur-').map(n => `<tr><td>${code(n)}</td><td>${esc(light[n])}</td></tr>`).join('')

const weights = [400, 500, 600, 700].map(w =>
  `<p style="font-weight:${w}"><span class="meta">${w}</span> INFORENT betreibt Rechenzentrum, Cloud und Netz.</p>`).join('')

const body = [
  section('grundsaetze', 'Grundsätze', 'Sechs Regeln, an denen sich jede Oberfläche misst — Portal, Website, Mail, PDF, Druck.', `
    <ol class="rules">
      <li><strong>Eckig.</strong> Flächen sind Rechtecke mit sichtbarem Rahmen. Alle Radien sind 0 px; nur Meter und Schieberegler sind rund (${code('--radius-pill')}).</li>
      <li><strong>Flach.</strong> Keine Verläufe. Tiefe entsteht durch einen 1-px-Rahmen und höchstens einen leichten Schatten.</li>
      <li><strong>Ein Blau für Handlungen.</strong> ${code('--primary')} ist die Hauptaktion, der Link, der Fokus. Pro Maske gibt es genau eine Hauptaktion.</li>
      <li><strong>Rot ist die Marke, nicht der Knopf.</strong> ${code('--brand')} erscheint als Strich unter der Wortmarke und als Markierung — nie als Button-Fläche, nie als kleiner Text.</li>
      <li><strong>Farbe ist nie allein.</strong> Jeder Zustand steht neben seinem Wort oder Symbol. Alle Textfarben erreichen WCAG AA (4,5 : 1) auf allen Flächen, hell wie dunkel.</li>
      <li><strong>Selbst gehostet.</strong> Schriften und Dateien kommen von uns, nie von einem fremden CDN.</li>
    </ol>`),

  section('logo', 'Wortmarke', 'Die einzige Marke. Die Grafik ist dunkel — sie steht deshalb immer auf einer weißen Platte, auch im dunklen Modus.', `
    <div class="logos">
      <figure><div class="plate"><img src="assets/logo.png" alt="INFORENT" width="200" height="110"></div><figcaption>Auf heller Fläche</figcaption></figure>
      <figure class="ondark"><div class="plate"><img src="assets/logo.png" alt="INFORENT" width="120" height="66"></div><figcaption>Auf dunkler Fläche: mit weißer Platte</figcaption></figure>
      <figure><div class="plate signature"><img src="assets/logo.png" alt="INFORENT" width="120" height="66"><span class="rule"></span></div><figcaption>Signatur: kurzer roter Strich darunter (Website, Briefkopf)</figcaption></figure>
    </div>
    <p>Nie umfärben, drehen, beschneiden oder mit Schatten versehen. Mindesthöhe 30 px. Datei: ${code('logo.png')} (200 × 110).</p>`),

  section('farben', 'Farben', 'Schiefer-Neutraltöne, ein Blau, ein Rot für die Marke, ein Rot für Gefahr. Links hell, rechts dunkel.', `
    <div class="cores">${coreGrid}</div>
    <details><summary>Alle ${colorNames.length} Farbvariablen</summary>${allColors}</details>`),

  section('schrift', 'Schrift', `${code('Inter')} für alles, ${code('JetBrains Mono')} für Kennungen und Code. Schnitte 400 / 500 / 600 / 700; 800 nur für große Überschriften der Website.`, `
    <div class="weights">${weights}</div>
    <p class="mono">JetBrains Mono · web-01.fra1 · 2a0e:6a80::1 · irk_3f9c…</p>
    <h3>Größen</h3>
    <table class="grid"><tbody>${typeScale}</tbody></table>
    <h3>Zeilenhöhe</h3>
    <table class="grid"><tbody>${leading}</tbody></table>`),

  section('raster', 'Abstände, Ecken, Schatten', 'Die Abstandsleiter ist 2-px-basiert, weil das Portal dicht ist.', `
    <table class="grid"><tbody>${spacing}</tbody></table>
    <h3>Ecken</h3><div class="boxes">${radii}</div>
    <h3>Schatten</h3><div class="boxes">${shadows}</div>
    <h3>Bewegung</h3><table class="grid"><tbody>${motion}</tbody></table>
    <p class="note">Kurz (${esc(light['--dur-fast'])}) für einen Zustandswechsel, mittel für etwas, das über den Schirm fährt, lang für einen Balken, der sich füllt. „Bewegung reduzieren“ im Betriebssystem schaltet alles ab.</p>`),

  section('bausteine', 'Bausteine', 'Die Optik der gemeinsamen Bausteine aus <code>components.css</code> — dieselbe Definition, die das Portal als Stilobjekte nutzt. Die Regel steht neben jeder Gruppe.', `
    <h3>Knöpfe</h3>
    <p class="note">Hauptaktion <code>primary</code>, eine je Maske, ganz rechts · Abbrechen <code>secondary</code> links daneben · Löschen <code>danger-outline</code>, gefüllt nur im Bestätigungsdialog · <code>ghost</code> für Drittaktionen im Inhalt · <code>admin</code> nur für Neben-Aktionen, die allein Admins sehen.</p>
    ${['md', 'sm', 'xs'].map(sz => `<div class="row"><span class="meta">${sz}</span>${['primary', 'secondary', 'ghost', 'danger', 'danger-outline', 'admin'].map(v => `<button type="button" class="ir-btn ir-btn--${sz} ir-btn--${v}">${v}</button>`).join('')}</div>`).join('')}
    <div class="row"><span class="meta"></span><button type="button" class="ir-btn ir-btn--md ir-btn--primary" disabled>gesperrt</button><button type="button" class="ir-btn ir-btn--md" disabled>gesperrt</button><a class="ir-btn ir-btn--md" href="#bausteine">Link im Knopf-Look</a></div>
    <h3>Felder</h3>
    <p class="note">Eine Höhe für Feld, Auswahlliste und Knopf <code>md</code> (<code>--control-height</code>). Beschriftung über dem Feld.</p>
    <div class="fields">
      <label>Hostname<input class="ir-input" value="web-01"></label>
      <label>IP-Adresse<input class="ir-input ir-input--mono" value="2a0e:6a80::1"></label>
      <label>Abgelehnt<input class="ir-input" aria-invalid="true" value="web 01"></label>
      <label>Nur lesbar<input class="ir-input" readonly value="kunde-4711"></label>
      <label><span class="admin-label">Nur Admins</span><input class="ir-input ir-input--admin"></label>
      <label>Klein<input class="ir-input ir-input--sm" value="kompakt"></label>
    </div>
    <div class="row"><button type="button" class="ir-btn ir-btn--md">Abbrechen</button><input class="ir-input" placeholder="Suche…" style="width:200px"><button type="button" class="ir-btn ir-btn--md ir-btn--primary">Speichern</button><span class="note">— eine Leiste, eine Höhe</span></div>
    <h3>Abzeichen</h3>
    ${['', 'solid', 'outline'].map(vr => `<div class="row"><span class="meta">${vr || 'soft'}</span>${['neutral', 'primary', 'success', 'danger', 'warning', 'info', 'accent'].map(t => `<span class="ir-badge ir-badge--md ir-badge--${t}${vr ? ` ir-badge--${vr}` : ''}">${t}</span>`).join('')}</div>`).join('')}
    <h3>Hinweise</h3>
    <div class="stack">${[['error', 'Das hat nicht geklappt. Bitte erneut versuchen.'], ['warning', 'Die Domain läuft in 7 Tagen ab.'], ['success', 'Gespeichert.'], ['info', 'Änderungen werden nach dem nächsten Lauf sichtbar.']].map(([t, x]) => `<div class="ir-alert ir-alert--${t}">${x}</div>`).join('')}</div>
    <h3>Flächen</h3>
    <div class="cols">
      <div class="ir-card"><strong>Karte</strong><p class="note">Überschrift, Rahmen, leichter Schatten.</p></div>
      <div class="ir-card ir-card--admin"><strong>Karte, nur Admins</strong><p class="note">Rahmen in Admin-Violett.</p></div>
      <div class="ir-panel ir-panel--plain ir-panel--pad">Fläche plain</div>
      <div class="ir-panel ir-panel--muted ir-panel--pad">Fläche muted</div>
      <div class="ir-panel ir-panel--inset ir-panel--pad">Fläche inset</div>
    </div>
    <h3>Aktionsleiste</h3>
    <p class="note">Erscheint unten, sobald Zeilen ausgewählt sind: Anzahl links, Aktionen rechts, „Auswahl aufheben“ zuletzt.</p>
    <div class="ir-action-bar"><strong style="margin-right:auto">3 ausgewählt</strong><button type="button" class="ir-btn ir-btn--sm ir-btn--on-bar ir-btn--secondary">Bearbeiten</button><button type="button" class="ir-btn ir-btn--sm ir-btn--on-bar ir-btn--danger-outline">Löschen</button><button type="button" class="ir-btn ir-btn--sm ir-btn--primary">Aktionen ▸</button><button type="button" class="ir-btn ir-btn--sm ir-btn--on-bar ir-btn--ghost">Auswahl aufheben</button></div>`),

  section('beispiel', 'Zusammengesetzt', 'So greifen die Werte ineinander — Karte, Überschrift, Feld, Hauptaktion, Nebenaktion.', `
    <div class="demo ir-card">
      <h3>Cloud-Server bestellen</h3>
      <p class="muted">Stundengenau abgerechnet, mit Monatsdeckel.</p>
      <label>Hostname<input class="ir-input" value="web-01"></label>
      <div class="actions"><button type="button" class="ir-btn ir-btn--md">Abbrechen</button><button type="button" class="ir-btn ir-btn--md ir-btn--primary">Bestellen</button></div>
    </div>`),

  section('ton', 'Sprache', 'Sachlich, kurz, direkt. Deutsch ist die Ausgangssprache, Englisch spiegelt sie.', `
    <ul class="rules">
      <li>Fehlermeldungen nennen die Lösung, nicht die Schuld.</li>
      <li>Erfolgsmeldungen sind eine Zeile.</li>
      <li>Im Portal keine Werbesprache — die Website darf verkaufen, das Portal informiert.</li>
      <li>Name: <strong>INFORENT</strong>; in Rechtstexten und Fußzeilen <strong>INFORENT GmbH</strong>.</li>
    </ul>`),
].join('\n')

const html = `<!doctype html>
<html lang="de" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>INFORENT Corporate Identity</title>
<meta name="description" content="Farben, Schrift, Wortmarke und Regeln der INFORENT Corporate Identity.">
<link rel="icon" href="assets/logo.png">
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/components.css">
<style>
@font-face { font-family: 'Inter'; font-weight: 400; font-display: swap; src: url(assets/fonts/inter-400.woff2) format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 500; font-display: swap; src: url(assets/fonts/inter-500.woff2) format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 600; font-display: swap; src: url(assets/fonts/inter-600.woff2) format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 700; font-display: swap; src: url(assets/fonts/inter-700.woff2) format('woff2'); }
@font-face { font-family: 'JetBrains Mono'; font-weight: 400; font-display: swap; src: url(assets/fonts/mono-400.woff2) format('woff2'); }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--ui-font); font-size: var(--font-lg); line-height: var(--leading-relaxed); }
header.top { background: var(--surface); border-bottom: 1px solid var(--border); }
.wrap { max-width: 1040px; margin: 0 auto; padding: 0 var(--space-24); }
header.top .wrap { display: flex; align-items: center; gap: var(--space-16); padding-block: var(--space-16); }
header.top .plate { padding: var(--space-6) var(--space-10); }
header.top h1 { font-size: var(--font-xl); margin: 0; color: var(--text-heading); }
header.top .ver { color: var(--text-subtle); font-size: var(--font-sm); }
header.top nav { margin-left: auto; display: flex; gap: var(--space-16); align-items: center; font-size: var(--font-sm); }
a { color: var(--primary); }
nav.toc { display: flex; flex-wrap: wrap; gap: var(--space-6) var(--space-16); padding: var(--space-16) 0; font-size: var(--font-sm); }
section { background: var(--surface); border: 1px solid var(--border); padding: var(--space-24) var(--space-32); margin-bottom: var(--space-24); }
h2 { font-size: var(--font-xxl); color: var(--text-heading); margin: 0 0 var(--space-4); }
h3 { font-size: var(--font-lg); color: var(--text-heading); margin: var(--space-24) 0 var(--space-8); }
.lead { color: var(--text-muted); margin: 0 0 var(--space-20); }
.note, .meta, figcaption, .muted { color: var(--text-subtle); font-size: var(--font-sm); }
.meta { display: inline-block; width: 3em; }
code, .mono { font-family: var(--mono-font); font-size: var(--font-sm); }
code { white-space: nowrap; background: var(--surface-muted); border: 1px solid var(--border-subtle); padding: 0 var(--space-4); color: var(--text-heading); }
.rules { padding-left: var(--space-20); margin: 0; display: grid; gap: var(--space-8); }
.plate { display: inline-block; background: #fff; padding: var(--space-10) var(--space-16); line-height: 0; } /* die Wortmarke steht immer auf Weiß */
.logos { display: flex; flex-wrap: wrap; gap: var(--space-24); align-items: flex-end; }
.logos figure { margin: 0; display: grid; gap: var(--space-8); }
.ondark { background: var(--sidebar); padding: var(--space-16); }
.ondark figcaption { color: var(--bar-text-muted); }
.signature { display: grid; justify-items: start; gap: var(--space-6); line-height: normal; }
.rule { display: block; width: 36px; height: 2px; background: var(--brand); }
.cores { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-16); margin-bottom: var(--space-16); }
.core p { margin: var(--space-4) 0 0; font-size: var(--font-sm); color: var(--text-muted); line-height: var(--leading-normal); }
.pair { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: var(--space-8); border: 1px solid var(--border); }
.pair .sw { display: grid; }
.pair .chip { height: 56px; }
.pair .hex { font-family: var(--mono-font); font-size: var(--font-xxs); color: var(--text-subtle); padding: var(--space-2) var(--space-6); }
.sw { display: inline-flex; align-items: center; gap: var(--space-8); }
table .chip { width: 40px; height: 20px; border: 1px solid var(--border-subtle); }
table .hex { font-family: var(--mono-font); font-size: var(--font-xs); }
.grid { border-collapse: collapse; width: 100%; font-size: var(--font-sm); }
.grid th, .grid td { text-align: left; padding: var(--space-6) var(--space-10); border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
.grid th { color: var(--text-muted); font-weight: 600; }
details summary { cursor: pointer; color: var(--primary); font-size: var(--font-sm); margin-bottom: var(--space-8); }
.bar { display: inline-block; height: 12px; background: var(--primary); }
.boxes { display: flex; flex-wrap: wrap; gap: var(--space-16); }
.box { width: 132px; height: 72px; display: grid; place-items: center; text-align: center; background: var(--surface); border: 1px solid var(--border-strong); font-size: var(--font-xs); }
.shadowbox { border-color: var(--border-subtle); }
.weights p { margin: var(--space-4) 0; font-size: var(--font-xl); }
.demo { max-width: 420px; }
.demo h3 { margin: 0; }
.demo p { margin: var(--space-4) 0 var(--space-16); }
.demo label { display: grid; gap: var(--space-6); font-size: var(--font-md); font-weight: 500; color: var(--text-heading); }
.actions { display: flex; justify-content: flex-end; gap: var(--space-8); margin-top: var(--space-16); }
.theme { font: inherit; font-size: var(--font-sm); padding: var(--space-4) var(--space-10); border: 1px solid var(--border); background: var(--surface); color: var(--text-heading); cursor: pointer; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-8); margin: var(--space-8) 0; }
.row .meta { width: 4em; }
.fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-12); margin-bottom: var(--space-8); }
.fields label { display: grid; gap: var(--space-6); font-size: var(--font-md); font-weight: 500; color: var(--text-heading); }
.admin-label { color: var(--admin-text); }
.stack { display: grid; gap: var(--space-8); }
.cols { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-12); }
footer { color: var(--text-subtle); font-size: var(--font-sm); padding: var(--space-8) 0 var(--space-32); }
@media (max-width: 640px) { section { padding: var(--space-16); } header.top nav a { display: none; } }
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <span class="plate"><img src="assets/logo.png" alt="INFORENT" width="64" height="35"></span>
  <div><h1>Corporate Identity</h1><span class="ver">Stand ${esc(pkg.version)}</span></div>
  <nav><a href="https://github.com/INFORENT-GmbH/INFORENT-Brand">Quelle auf GitHub</a>
    <button type="button" class="theme" id="theme" aria-pressed="false">Dunkel ansehen</button></nav>
</div></header>
<main class="wrap">
<nav class="toc" aria-label="Inhalt">
  <a href="#grundsaetze">Grundsätze</a><a href="#logo">Wortmarke</a><a href="#farben">Farben</a><a href="#schrift">Schrift</a><a href="#raster">Abstände, Ecken, Schatten</a><a href="#bausteine">Bausteine</a><a href="#beispiel">Zusammengesetzt</a><a href="#ton">Sprache</a>
</nav>
${body}
<footer>Erzeugt aus ${code('tokens.css')} von ${code(`@inforent/brand ${pkg.version}`)}. © INFORENT GmbH</footer>
</main>
<script>
  // Hell ist die Vorgabe (die Website kennt nur hell); der Schalter zeigt die
  // dunkle Palette des Portals — gemerkt wird nichts.
  const b = document.getElementById('theme')
  b.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark'
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    b.setAttribute('aria-pressed', String(dark))
    b.textContent = dark ? 'Hell ansehen' : 'Dunkel ansehen'
  })
</script>
</body>
</html>
`

// ── write ─────────────────────────────────────────────────────────────────────
rmSync(out, { recursive: true, force: true })
mkdirSync(new URL('assets/fonts/', out), { recursive: true })
writeFileSync(new URL('index.html', out), html)
for (const f of ['tokens.css', 'base.css', 'components.css', 'logo.png']) copyFileSync(new URL(f, root), new URL(`assets/${f}`, out))
const fonts = new URL('node_modules/@fontsource/', root)
for (const w of [400, 500, 600, 700]) copyFileSync(new URL(`inter/files/inter-latin-${w}-normal.woff2`, fonts), new URL(`assets/fonts/inter-${w}.woff2`, out))
copyFileSync(new URL('jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', fonts), new URL('assets/fonts/mono-400.woff2', out))
console.log(`site: site-dist/ geschrieben (${colorNames.length} Farben, Stand ${pkg.version})`)
