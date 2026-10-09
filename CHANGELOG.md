# Changelog

## 1.4.0 — 2026-10-09

- **Portal-Redesign 2026, Etappe 1 (Tokens):** die Flächen werden weich — `--radius-xxs…xl` =
  2/4/6/6/8/12 px statt 0; Ränder sind Haarlinien (`--border-subtle #eceff3`, `--border #e2e7ee`,
  `--border-strong` bleibt), die Tiefe trägt `--shadow-sm`; `--bg #f5f7fa`.
- **Seitenleiste folgt dem Theme:** `--sidebar*` sind hell (weiße Leiste, Haarlinie, aktiver Eintrag
  `--primary-soft`/`--primary-strong`) und im Dark Mode die dunkle Fläche — nicht mehr Schiefer in
  beiden Themes. Namen unverändert; Skins überschreiben sie weiter.
- Neue Schriftstufen `--font-display` (24 px, Seitentitel) und `--font-stat` (28 px, Kennzahl).
- brand-lint: Meldung der Radius-Regel umformuliert (die Regel selbst bleibt: nur `var(--radius-*)`).

## 1.3.1 — 2026-09-25

- `components.css`: Hover/aktiv auch für Links im Knopf-Look (`a.ir-btn`) — `base.css` deckt nur `<button>` ab.

## 1.3.0 — 2026-09-25

- **Baustein-Optik:** `components.css` (Klassen `ir-btn`, `ir-input`, `ir-badge`, `ir-alert`,
  `ir-card`, `ir-panel`, `ir-action-bar`) und `@inforent/brand/components` (dieselben Stile als
  typisierte Objekte für Inline-Styles). Beides erzeugt `npm run gen` aus EINER Definition,
  `components.def.mjs` — übernommen 1:1 aus dem Portal. Sechs Knopf-Varianten, drei Größen,
  eine Feldhöhe (`--control-height`), sieben Badge-Töne, vier Hinweis-Töne.

## 1.2.0 — 2026-09-23

- `values.light` / `values.dark` in `@inforent/brand/vars`: die aufgelösten Werte je Theme für
  Canvas, WebGL und SVG-Attribute, wo `var()` nicht wirkt — Diagramme folgen so der Brand.
- brand-lint: Ausnahme-Blöcke `brand-allow-start: <Grund>` … `brand-allow-end`; eine Ausnahme
  zählt nur noch mit Begründung (`brand-allow: <Grund>`).

## 1.1.0 — 2026-09-23

- `base.css`: gemeinsame Element-Regeln aus dem Portal (Fokus, Formularfelder, Buttons,
  Auswahl, Scrollbalken, Skip-Link, reduzierte Bewegung).
- `@inforent/brand/vars`: jede Variable als typisierte Konstante (`vars.textMuted`).
- `brand-lint`: Prüfskript für Verbraucher — Farbwerte, Verläufe, Radien, Schriften,
  Schrift-CDNs, unbekannte Variablen; mit Ausnahme-Kommentar und Baseline.

## 1.0.0 — 2026-09-23

- Erste Version: `tokens.css` (Stand des Portals `web/index.html`) und `logo.png`, ausgelagert aus
  INFORENT-Portal, damit Portal und Website dieselbe Quelle haben.
