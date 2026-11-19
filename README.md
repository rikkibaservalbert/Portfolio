# Rikki Valbert Baser — Portfolio

A static portfolio built with semantic HTML, modern CSS, and browser JavaScript. It has no runtime dependencies or build step.

## Files

- `index.html`: page content, `<template id="collection-*">` definitions, inline SVG icon sprite, and theme bootstrap.
- `style.css`: design tokens, light and dark themes, layout components, responsive breakpoints, and `prefers-reduced-motion` safeguards.
- `script.js`: independent initializers for theme persistence, header scroll state, mobile navigation and active section tracking, role rotator, scroll-reveal animations, and the unified collection viewer dialog.
- `images/`: portfolio artwork, brand previews, filmstrip thumbnails (`images/thumbs/`), and portrait assets.
- `files/`: the current résumé PDF.
- `scripts/make-thumbnails.ps1`: generates lightweight filmstrip thumbnails in `images/thumbs/<collection>/` from full-resolution artwork.
- `scripts/check.mjs`: source, anchor, asset, template link, and CSS variable checks.
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

Each project or design collection defines a `<template id="collection-<id>">` with `data-title` and `data-label`. Inside the template:

- `[data-slot="details"]` (optional) holds the brand description, color palette swatches, and typography notes.
- `[data-slot="items"]` holds the filmstrip list (`<li><a href="full-size-image"><img src="thumbnail-image" alt="..." /></a></li>`).

Any link with `data-open-collection="<id>"` opens the unified `<dialog class="viewer" data-viewer>` populated from `#collection-<id>`. Full-resolution images are fetched on demand only when selected on the viewer stage.

After adding or replacing collection artwork, regenerate the filmstrip thumbnails on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/make-thumbnails.ps1
```

Replace the PDF in `files/` and update the résumé links in `index.html` when its filename changes.

## Publishing

Changes are pushed only when requested. The existing Vercel integration deploys commits pushed to `main`; a push can therefore update production automatically. There is no separate build command.
