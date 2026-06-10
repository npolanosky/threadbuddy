# Development

Most people should just use the [live app](https://npolanosky.github.io/threadbuddy/). This document
is for contributors who want to build or modify ThreadBuddy locally.

ThreadBuddy is a static web app: a framework-agnostic TypeScript calculation engine (`engine/`) and a
vanilla-TypeScript UI (`web/`), built with Vite.

## Prerequisites

- Node.js (LTS)

## Commands

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # Vitest integrity test suite
npm run build      # type-check + build the static site into /docs
npm run preview    # serve the built site
```

## Project layout

- `engine/src/core/` — one calculation module per standard family, plus shared geometry/rounding
- `engine/src/data/` — size catalogs and drill / pipe-length data
- `engine/tests/` — fixture and invariant tests (the data-integrity gate)
- `web/` — the single-page UI
- `web/public/` — static assets copied verbatim to the build (manifest, service worker, icons)

## Deploying

Pushing to `main` updates the site; GitHub Pages serves the built output from `/docs`:

```bash
npm run build
git add -A && git commit -m "your message" && git push
```

Pages rebuilds within about a minute.

## PWA

A web app manifest and service worker make ThreadBuddy installable and offline-capable. The service
worker (`web/public/sw.js`) uses cache-first with background refresh; bump the cache name there when
you need to force clients to update.

## Header mascot

The header mascot loads from `web/public/tap-sensei.png`. If that file is absent, a placeholder SVG
is shown instead.
