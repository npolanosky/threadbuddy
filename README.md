# ThreadPal Web

An open, cross-platform, install-free **screw-thread dimension calculator** — a clean-room
reimplementation of the much-loved Windows program **ME ThreadPal** (Michael Rainey / Close
Tolerance Software), which is now archived under a
[Public Domain Mark](https://archive.org/details/methread-pal-setup).

It runs in any modern browser (desktop or mobile), needs no installation, and deploys as static
files to GitHub Pages. The calculation engine is reconstructed directly from the public
engineering standards and validated against their published tables. See
[PROVENANCE.md](PROVENANCE.md) for the methodology and legal basis.

> ⚠️ **Early draft.** Core thread families are validated; others are in progress (see the coverage
> matrix). Always verify safety-critical values against the governing standard.

## Quick start

```bash
npm install
npm run dev        # live dev server (http://localhost:5173)
npm test           # run the integrity test suite (Vitest)
npm run build      # type-check + build static site into /docs
npm run preview    # serve the built site
```

Deploy: push, then in GitHub → **Settings → Pages**, serve from branch `main` `/docs`.

## How it works

- **`engine/`** — a framework-agnostic TypeScript calculation core. One formula module per
  standard family, sharing geometry/rounding helpers. All math runs in the thread's native unit
  (inch or mm); display conversion happens only in the UI.
- **`web/`** — a static single-page app that reproduces the original's dashboard layout
  (External / Internal dimensions, Measurement Over Wires, Classes of Fit, Starts·Pitch·Lead,
  Tap Drill, Length of Engagement, Display Options) and calls the engine live.
- **`engine/reference-tables/` + `engine/tests/`** — the data-integrity gate: values digitized
  from published standards plus invariant tests.

## Data-integrity status

The engine reproduces the published **½-13 UNC** rows exactly (2A pitch dia `0.4485/0.4435`,
allowance `0.0015`, major `0.4985/0.4876`; 2B pitch dia `0.4565/0.4500`; internal minor min
`0.4167`) using length of engagement = basic major diameter and ASME B1.30 rounding — this is the
primary proof the formulas match the standard. 157 tests pass.

## Coverage matrix

| Thread family | Governing standard | Basic dims | Tolerance limits | Catalog sizes | Status |
|---|---|---|---|---|---|
| UN / UNC / UNF / UNEF / UNS | ASME B1.1-2003 | ✅ exact | ✅ validated (PD, major, allowance) | 69 | **Validated** |
| UNR (rounded root) | ASME B1.1-2003 | ✅ | ✅ (shares UN) | (UN) | Validated |
| UNJ | SAE AS8879C | ⚠️ via UN basis | ⚠️ approximate | — | Provisional |
| Metric M / MS | ISO 965 / B1.13M | ✅ exact | ⚠️ computed (±~1 µm vs ISO R40 table) | 43 | Partial |
| Metric MJ | ASME B1.21M / ISO 5855 | ⚠️ via M basis | ⚠️ approximate | — | Provisional |
| Acme GP / Centralizing / Stub | ASME B1.5-1997 | ✅ exact | ⚠️ provisional | 21 | Partial |
| UNM, STI, Pg conduit | B1.10 / mfr / DIN 40430 | ⚠️ routed to nearest engine | ⚠️ | — | Provisional |
| Whitworth (BSW/BSF) | BS 84:1956 | ⬜ planned | ⬜ | — | Not yet |
| US Buttress 7×45 | ASME B1.9 | ⬜ planned | ⬜ | — | Not yet |
| ISO Trapezoidal | ISO 2901 | ⬜ planned | ⬜ | — | Not yet |
| ISO Buttress 3×30 | DIN 513 | ⬜ planned | ⬜ | — | Not yet |
| NPT / NPTF / NPSM / NPSL | ASME B1.20.1 | ⬜ planned | ⬜ | — | Not yet |
| BSPT / BSPP | ISO 7-1 | ⬜ planned | ⬜ | — | Not yet |

Legend: ✅ exact/validated · ⚠️ implemented, not yet table-validated (flagged in the app's Notes
panel) · ⬜ planned. Nothing provisional is presented as if it were validated.

## Roadmap to full parity with ME ThreadPal

1. Encode ISO 965 R40 tolerance tables so metric limits are exact (not ±1 µm).
2. Full ASME B1.5 Acme tolerance tables + reconcile the documented lead-angle convention.
3. Add the remaining families (pipe threads, Whitworth, buttress, trapezoidal, miniature, STI).
4. Internal minor-diameter tolerance per ASME B1.1; UNR root radius; UNJ controlled root radius.
5. Coating/plating allowances, percent-thread/tap-drill chart, CSV export, terminology popups.
6. Designation polish (UNC/UNF series labels), printable report styling.

## Acknowledgement

ME ThreadPal was created by **Michael Rainey** of Close Tolerance Software. This project exists to
keep that resource alive and cross-platform. The original program, its help files, and its UI art
are **not** included here; this is an independent reconstruction from public standards.
