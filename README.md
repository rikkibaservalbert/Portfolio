# Rikki Valbert Baser — Portfolio

A static portfolio built with HTML, CSS, and browser JavaScript. It has no runtime dependencies or build step.

## Files

- `index.html`: page content, project collections, and a small head bootstrap for the saved theme and intro.
- `style.css`: themes, components, responsive layouts, and motion preferences. Rule order is intentional.
- `script.js`: independent initializers for navigation, theme, role text, project carousel, artwork dialogs, cursor, and page motion.
- `images/`: portfolio artwork and profile assets.
- `files/`: the current résumé PDF.
- `scripts/check.mjs`: source, anchor, asset, and CSS variable checks.
- `tests/portfolio.test.mjs`: interaction tests using a simulated DOM.

## Development

Use Node.js 24.15 or later and npm.

```sh
npm ci
npm run check
npm test
npm run format:check
```

Open the folder with a local static server to preview the page. After editing, run `npm run format` and repeat the checks. The development dependencies are used only for formatting and verification.

## Updating content

Each gallery card identifies a collection with `data-collection`. Its matching `.design-item` links populate the artwork dialog; the card's template holds the brand description, palette, and typography notes. Keep the card photo count consistent with its individual artwork links. Presentation boards are used as card covers, not viewer entries.

Replace the PDF in `files/` and update both résumé links when its filename changes. Keep original brand artwork and palette colors separate from the site's monochrome theme.

## Publishing

Changes are pushed only when requested. The existing Vercel integration deploys commits pushed to `main`; a push can therefore update production automatically. There is no separate build command.
