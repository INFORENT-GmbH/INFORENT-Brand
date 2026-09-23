# Changelog

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
