// Die Optik der Bausteine — EINE Definition, zwei Ausgaben (scripts/gen-components.mjs):
//   components.css   Klassen (.ir-btn, .ir-input, …) für Website, Styleguide, statische Seiten
//   components.js    dieselben Stile als Objekte für Inline-Styles (das Portal, React)
//
// Übernommen 1:1 aus dem Portal (INFORENT-Portal web/src/styles/*, Stand 25.09.2026),
// das die Referenz ist: sechs Knopf-Varianten, drei Größen, eine Feldhöhe, sieben
// Badge-Töne, vier Alert-Töne, Karte, Fläche, Aktionsleiste. Nur Werte aus
// tokens.css (über vars.*), keine Literale außer Layout-Schlüsselwörtern.
//
// Regeln, WANN welche Variante gilt: README.md §Bausteine und brand.inforent.com.
// Eine Änderung hier = Minor-Version; eine entfernte Klasse/Variante = Major.

import { vars as v } from './vars.js'

const inset = (y, x) => `${y} ${x}`
const border = c => `1px solid ${c}`

/** Höhe eines Standard-Bedienelements: Feld, Auswahlliste, Knopf `md`. */
export const controlHeight = `calc(2 * ${v.space8} + ${v.fontSm} * ${v.leadingSnug} + 2px)`

export const button = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: v.space6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    lineHeight: v.leadingSnug,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
  sizes: {
    xs: { padding: inset(v.space2, v.space6), fontSize: v.fontXs, borderRadius: v.radiusXs, fontWeight: '600' },
    sm: { padding: inset(v.space4, v.space10), fontSize: v.fontSm, borderRadius: v.radiusSm, fontWeight: '600' },
    md: { padding: inset(v.space8, v.space14), fontSize: v.fontSm, borderRadius: v.radiusMd, fontWeight: '500' },
  },
  // Gefüllte Varianten tragen einen Rahmen in eigener Farbe, damit sie mit
  // `secondary` (echter Rahmen) pixelgleich hoch stehen.
  variants: {
    primary:       { background: v.primary, color: v.onPrimary, border: border(v.primary) },
    secondary:     { background: v.surface, color: v.textHeading, border: border(v.border) },
    ghost:         { background: 'transparent', color: v.textMuted, border: '1px solid transparent' },
    danger:        { background: v.danger, color: v.onPrimary, border: border(v.danger) },
    dangerOutline: { background: v.surface, color: v.dangerText, border: border(v.dangerBorder) },
    admin:         { background: v.adminSoft, color: v.adminText, border: border(v.adminBorder) },
  },
  // Dieselben Varianten auf der dunklen Aktionsleiste (`--bar`, in beiden Themes
  // dunkel). primary/danger sind gefüllt und stehen auf jedem Grund.
  onBar: {
    secondary:     { background: 'transparent', color: v.barText, border: border(v.barBtnBorder) },
    ghost:         { background: 'transparent', color: v.barTextMuted, border: '1px solid transparent' },
    admin:         { background: v.adminTint, color: v.barText, border: border(v.adminTint) },
    dangerOutline: { background: 'transparent', color: v.barText, border: border(v.danger) },
  },
}

export const input = {
  base: {
    padding: inset(v.space8, v.space10),
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: v.border,
    borderRadius: v.radiusMd,
    fontSize: v.fontSm,
    background: v.surface,
    color: v.text,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    lineHeight: v.leadingSnug,
  },
  sm: { padding: inset(v.space4, v.space8), borderRadius: v.radiusSm, fontSize: v.fontXs },
  lg: { padding: inset(v.space8, v.space12), fontSize: v.fontLg },
  textarea: { resize: 'vertical', lineHeight: v.leadingNormal, minHeight: '4.5rem' },
  mono: { fontFamily: v.monoFont },
  admin: { borderColor: v.adminBorder },
  invalid: { borderColor: v.danger },
  // Nur lesbar: abgesetzte Fläche, leisere Schrift — nicht `opacity` (Kontrast).
  readOnly: { background: v.surfaceHover, color: v.textSoft },
}

export const badge = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: v.space4,
    borderRadius: v.radiusPill,
    fontWeight: '600',
    lineHeight: v.leadingNormal,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  sizes: {
    sm: { padding: inset(v.space1, v.space6), fontSize: v.fontXxs },
    md: { padding: inset(v.space2, v.space8), fontSize: v.fontXs },
  },
  tones: {
    neutral: { soft: v.surfaceHover, text: v.textSoft,      solid: v.textSoft, onSolid: v.onPrimary },
    primary: { soft: v.primarySoft,  text: v.primaryStrong, solid: v.primary,  onSolid: v.onPrimary },
    success: { soft: v.successSoft,  text: v.successText,   solid: v.success,  onSolid: v.onPrimary },
    danger:  { soft: v.dangerSoft,   text: v.dangerText,    solid: v.danger,   onSolid: v.onPrimary },
    warning: { soft: v.warningSoft,  text: v.warningText,   solid: v.warning,  onSolid: v.warningOnBar },
    info:    { soft: v.infoSoft,     text: v.info,          solid: v.info,     onSolid: v.onPrimary },
    accent:  { soft: v.accentSoft,   text: v.accentText,    solid: v.accent,   onSolid: v.onPrimary },
  },
  outlineBorder: v.border,
}

export const alert = {
  base: {
    padding: inset(v.space8, v.space12),
    borderRadius: v.radiusMd,
    fontSize: v.fontSm,
    lineHeight: v.leadingSnug,
    whiteSpace: 'pre-wrap',
  },
  tones: {
    error:   { bg: v.dangerSoft,   fg: v.dangerText,  border: v.dangerBorder },
    warning: { bg: v.warningSoft,  fg: v.warningText, border: v.warning },
    success: { bg: v.successSoft,  fg: v.successText, border: v.success },
    info:    { bg: v.surfaceMuted, fg: v.textHeading, border: v.border },
  },
}

export const card = {
  base: { background: v.surface, border: border(v.border), borderRadius: v.radiusLg, padding: v.space24, boxShadow: v.shadowSm },
  admin: { border: border(v.adminBorder) },
}

export const panel = {
  plain: { background: v.surface, borderWidth: '1px', borderStyle: 'solid', borderColor: v.border, borderRadius: v.radiusMd, minWidth: '0' },
  muted: { background: v.surfaceMuted, borderRadius: v.radiusMd, minWidth: '0' },
  inset: { background: v.bg, borderRadius: v.radiusMd, minWidth: '0' },
  pad: { padding: inset(v.space10, v.space12) },
}

export const actionBar = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: v.space8,
  padding: inset(v.space8, v.space14),
  background: v.bar,
  color: v.barText,
  borderTop: border(v.barBorder),
  boxShadow: v.shadowUp,
  flexShrink: '0',
  fontSize: v.fontSm,
}
