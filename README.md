# INFORENT Brand

Die **eine Quelle** der Corporate Identity: Design-Tokens als CSS-Variablen und die Wortmarke.
Portal ([INFORENT-Portal](https://github.com/INFORENT-GmbH/INFORENT-Portal)) und Website
([INFORENT-Website](https://github.com/INFORENT-GmbH/INFORENT-Website)) beziehen beide dieses Paket —
keiner der beiden definiert Farben selbst.

| Datei | Inhalt |
|---|---|
| `tokens.css` | drei `:root`-Regeln: Geometrie (Abstände, Radien, Schriftgrößen, Schatten, Dauer), helle Palette, dunkle Palette (`:root[data-theme='dark']`) |
| `logo.png` | die Wortmarke (200 × 110, dunkle Grafik) |

Bedeutung und Regeln der Werte (wann `--brand`, wann `--primary`, Kontraste, Schriften):
`docs/areas/brand.md` im Portal-Repo.

## Einbinden

Das Paket liegt nicht auf npmjs.com, sondern als Anhang am GitHub-Release — eine feste Datei,
deren Prüfsumme im `package-lock.json` steht:

```bash
npm install https://github.com/INFORENT-GmbH/INFORENT-Brand/releases/download/v1.0.0/inforent-brand-1.0.0.tgz
```

```ts
import '@inforent/brand/tokens.css'   // zuerst — eigene Regeln danach überschreiben per Kaskade
import logo from '@inforent/brand/logo.png'
```

Dunkelmodus: `data-theme="dark"` auf `<html>` setzen, alle Variablen schalten mit.

## Regeln

- **Die Variablennamen sind die Schnittstelle.** Neuer Name oder geänderter Wert → Minor
  (`1.1.0`); Name umbenannt oder entfernt → Major (`2.0.0`), weil ein Verbraucher ihn noch lesen
  kann.
- **Nur Werte, keine Komponenten, kein globales CSS.** Zwischen `BEGIN tokens` und `END tokens`
  stehen ausschließlich die drei `:root`-Regeln (`npm run check` prüft das, das Portal auch).
- Abweichungen eines Verbrauchers (z. B. größere Schriften der Website) gehören in dessen eigenes
  CSS *nach* dem Import — nie hierher.
- Keine Verläufe, `--brand` (#ed1c24) nie als Button-Fläche und nie als Text unter ~24 px.

## Neue Version veröffentlichen

1. Änderung per Pull Request, `npm run check` muss grün sein.
2. `version` in `package.json` hochzählen, Eintrag in `CHANGELOG.md`.
3. Annotierten Tag setzen und pushen — der Tag-Text wird die Release-Notiz:
   ```bash
   git tag -a v1.1.0 -m "v1.1.0: --foo ergänzt"
   git push origin main v1.1.0
   ```
   Die Action `release` baut das Paket und hängt `inforent-brand-1.1.0.tgz` ans Release.
4. In Portal und Website die URL in `package.json` auf die neue Version setzen und `npm install`.
   Im Portal danach `npm run tokens:write` in `web/` (schreibt die Werte in `index.html` und die
   Kopien der Nebenseiten) und committen.
