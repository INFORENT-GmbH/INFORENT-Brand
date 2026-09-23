# INFORENT Brand

Die **eine Quelle** der Corporate Identity: Design-Tokens als CSS-Variablen und die Wortmarke.
Portal ([INFORENT-Portal](https://github.com/INFORENT-GmbH/INFORENT-Portal)) und Website
([INFORENT-Website](https://github.com/INFORENT-GmbH/INFORENT-Website)) beziehen beide dieses Paket —
keiner der beiden definiert Farben selbst.

| Datei | Inhalt |
|---|---|
| `tokens.css` | drei `:root`-Regeln: Geometrie (Abstände, Radien, Schriftgrößen, Schatten, Dauer), helle Palette, dunkle Palette (`:root[data-theme='dark']`) |
| `base.css` | globale Element-Regeln aller Oberflächen: Fokusrahmen, Formularfelder, Buttons (Hover, deaktiviert), Textauswahl, Scrollbalken, Skip-Link, reduzierte Bewegung — aus dem Portal übernommen |
| `vars.js` / `vars.d.ts` | jede Variable als typisierte Konstante: `vars.textMuted` = `'var(--text-muted)'`, dazu `values.light` / `values.dark` mit den aufgelösten Werten für Canvas, WebGL und SVG-Attribute (erzeugt aus `tokens.css`) |
| `logo.png` | die Wortmarke (200 × 110, dunkle Grafik) |
| `bin/brand-lint.mjs` | Prüfskript für die Verbraucher (siehe unten) |

<img src="logo.png" alt="INFORENT" width="120">

![Kernfarben hell und dunkel](preview/palette.svg)

<details>
<summary>Alle Farbvariablen (hell | dunkel)</summary>

![Alle Farbvariablen](preview/tokens.svg)

</details>

Die Bilder erzeugt `npm run preview` aus `tokens.css`; `npm run check` schlägt fehl, wenn sie nicht
mehr passen.

Bedeutung und Regeln der Werte (wann `--brand`, wann `--primary`, Kontraste, Schriften):
`docs/areas/brand.md` im Portal-Repo.

## Einbinden

Das Paket liegt nicht auf npmjs.com, sondern als Anhang am GitHub-Release — eine feste Datei,
deren Prüfsumme im `package-lock.json` steht:

```bash
npm install https://github.com/INFORENT-GmbH/INFORENT-Brand/releases/download/v1.1.0/inforent-brand-1.1.0.tgz
```

```ts
import '@inforent/brand/tokens.css'   // zuerst — die Werte
import '@inforent/brand/base.css'     // dann die gemeinsamen Element-Regeln
import './eigenes.css'                // zuletzt das Projekt-CSS (gewinnt per Kaskade)
import { vars } from '@inforent/brand/vars'
import logo from '@inforent/brand/logo.png'

const card = { background: vars.surface, border: `1px solid ${vars.border}`, borderRadius: vars.radiusLg }
```

`vars.*` statt Zeichenketten: ein Tippfehler oder eine Variable, die eine neue Brand-Version
entfernt hat, ist ein **Compile-Fehler** statt eines stumm leeren Werts im Browser.

Dunkelmodus: `data-theme="dark"` auf `<html>` setzen, alle Variablen schalten mit.

## Regeln

- **Die Variablennamen sind die Schnittstelle.** Neuer Name oder geänderter Wert → Minor
  (`1.1.0`); Name umbenannt oder entfernt → Major (`2.0.0`), weil ein Verbraucher ihn noch lesen
  kann.
- **Nur Werte, keine Komponenten, kein globales CSS.** Zwischen `BEGIN tokens` und `END tokens`
  stehen ausschließlich die drei `:root`-Regeln (`npm run check` prüft das, das Portal auch).
- Abweichungen eines Verbrauchers (z. B. größere Schriften der Website) gehören in dessen eigenes
  CSS *nach* dem Import — nie hierher.
- **Eckig:** `--radius-xxs` bis `--radius-xl` sind `0px` — Flächen sind Rechtecke mit sichtbarem
  Rahmen, die Tiefe kommt vom Rahmen, nicht von Rundung. Nur `--radius-pill` (999px) bleibt rund,
  für Meter und Schieberegler. Verbraucher setzen **keine eigenen Radien**, sondern nutzen immer
  `var(--radius-*)` — so folgen Portal und Website automatisch, falls sich das je ändert.
- Keine Verläufe, `--brand` (#ed1c24) nie als Button-Fläche und nie als Text unter ~24 px.

## brand-lint — Pflicht in beiden Projekten

Das Paket bringt ein Prüfskript mit, das Portal und Website in ihrer CI laufen lassen. Die Regeln
sind mit der Brand versioniert: eine neue Regel erreicht beide Projekte mit dem nächsten Update.

```bash
npx brand-lint site/                                         # Website
npx brand-lint --baseline brand-lint-baseline.json src …     # Portal (mit Ratsche)
```

| Regel | findet | stattdessen |
|---|---|---|
| `color` | `#hex`, `rgb()`, `hsl()` … im Code | `var(--…)` bzw. `vars.*` |
| `gradient` | `linear-/radial-/conic-gradient` | — die Brand hat keine Verläufe |
| `radius` | Eckenradius ≠ 0 als Zahl, eigene Radius-Skala | `var(--radius-*)` / `vars.radius*` (eckig) |
| `font` | Schriftfamilie als Text | `var(--ui-font)` / `var(--mono-font)` |
| `font-cdn` | Google Fonts, Typekit … | selbst hosten (`@fontsource`) |
| `unknown-var` | `var(--x)`, das es weder in der Brand noch im Projekt gibt | Tippfehler beheben / Namen aus der Brand |

Ausgenommen sind die generierten Brand-Kopien (zwischen `BEGIN tokens`/`END tokens` bzw.
`BEGIN base`/`END base`) und Kommentare. `<meta name="theme-color">` darf einen Hex-Wert tragen,
wenn er in der Brand vorkommt (dort funktioniert `var()` nicht).

**Begründete Ausnahme:** Kommentar `brand-allow: <Grund>` in derselben oder der Zeile darüber, oder
ein Block `brand-allow-start: <Grund>` … `brand-allow-end` (z. B. eine Diagrammpalette für
Canvas/SVG, eine fremde Marke). Ohne Grund zählt die Markierung nicht.

**Baseline (Ratsche):** `--baseline <datei>` erlaubt die bestehenden Befunde je Datei und Regel,
nur *mehr* schlägt fehl; `--write-baseline` schreibt den aktuellen Stand fest (auch nach dem Abbau).

## Neue Version veröffentlichen

1. Änderung per Pull Request, danach `npm run gen` (vars) und `npm run preview` (Vorschaubilder);
   `npm run check` muss grün sein.
2. `version` in `package.json` hochzählen, Eintrag in `CHANGELOG.md`.
3. Annotierten Tag setzen und pushen — der Tag-Text wird die Release-Notiz:
   ```bash
   git tag -a v1.1.0 -m "v1.1.0: --foo ergänzt"
   git push origin main v1.1.0
   ```
   Die Action `release` baut das Paket und hängt `inforent-brand-1.1.0.tgz` ans Release.
4. In Portal und Website die URL in `package.json` auf die neue Version setzen und `npm install`.
   Im Portal danach `npm run tokens:write` in `web/` (schreibt `tokens.css` und `base.css` in
   `index.html` und die Nebenseiten) und committen. `npm run lint` zeigt, ob neue Regeln greifen.
