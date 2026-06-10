# ThreadBuddy

An open, cross-platform, install-free **screw-thread dimension calculator** for machining.
ThreadBuddy is a clean-room reimplementation inspired by the much-loved Windows program
**ME ThreadPal** (Michael Rainey / Close Tolerance Software), which is now archived under a
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
| UNJ | SAE AS8879C | ✅ via UN basis | ⚠️ approximate | — | Partial |
| Metric M / MS | ISO 965 / B1.13M | ✅ exact | ⚠️ computed (±~1 µm vs ISO R40 table) | 43 | Partial |
| Metric MJ | ASME B1.21M / ISO 5855 | ✅ via M basis | ⚠️ approximate | — | Partial |
| Acme GP / Centralizing / Stub | ASME B1.5-1997 | ✅ exact | ⚠️ provisional | 21 | Partial |
| Whitworth (BSW/BSF) | BS 84:1956 | ✅ exact | ⚠️ provisional | 38 | Partial |
| ISO Trapezoidal | ISO 2901 | ✅ exact | ⚠️ provisional | 14 | Partial |
| US Buttress 7×45 / ISO 3×30 | ASME B1.9 / DIN 513 | ⚠️ approximate | ⚠️ provisional | 8 | Provisional |
| NPT / NPTF (taper) | ASME B1.20.1 | ✅ validated vs 1/16-27 (E0/E1, pipe-face & gage-notch dims, flats, truncation, L1–L4) | ⚠️ gauge-based | 26 | **Validated geometry** |
| NPSM / NPSL (straight) | ASME B1.20.1 | ✅ | ⚠️ provisional | 26 | Partial |
| BSPT / BSPP | ISO 7-1 | ✅ 55° form | ⚠️ provisional | 22 | Partial |
| UNM (miniature) | ASME B1.10 | ✅ (mm) | ⚠️ provisional | 14 | Partial |
| STI Unified / Metric | mfr reference | ✅ base series | ⬜ insert oversize pending | — | Provisional |
| Pg conduit | DIN 40430 | ✅ (mm) | ⚠️ provisional | 8 | Partial |

Legend: ✅ exact/validated · ⚠️ implemented, not yet table-validated (flagged in the app's Notes
panel) · ⬜ pending. Nothing provisional is presented as if it were validated. ~290 catalog sizes.

### Features

External/Internal dimension tables (max/min/mean/tol), flat-at-root & root-radius, **sharp-root**
toggle, allowance, basic thread height; **measurement over wires** (best/max/min wire, constant,
MOW limits) with **user alternate-wire** recompute; **starts / pitch / lead / lead-or-helix angle**;
length-of-engagement; **tap drills** with cut/form-tap selector, **thread-percent** selector and a
nearest-standard-drill table (number/letter/fractional/metric) showing resulting % thread; a
**coating / polishing** panel (before/after major & pitch, 4× rule, ± thickness-tolerance band,
internal/external); inch/metric display; print; **Reset all to default**.

**Tapered pipe threads (NPT/NPTF/BSPT)** get a dedicated layout: pipe-face & gauge-notch values for
major/pitch/minor, pipe diameter, crest/root flats & truncation, internal pipe-end-L1/pipe-face
minor, gauge-notch pitch, tap drill + reference depth, and engagement lengths L1–L4 — with thread
percent, length-of-engagement and form-tap controls automatically disabled.

UI conveniences: editable inputs are visually distinct from read-only outputs; yellow highlight marks
any value changed from default (alternate wire, multi-start/length-of-engagement, coating); the
alternate measuring wire updates the main MOW directly, and a "use coating/polish" option recomputes
MOW from the pre-process pitch diameter.

## Roadmap to full parity with ME ThreadPal

1. Encode ISO 965 R40 tolerance tables so metric limits are exact (not ±1 µm).
2. Full ASME B1.5 Acme tolerance tables + reconcile the documented lead-angle convention.
3. Per-standard tolerance tables for the families now shipping with provisional tolerances
   (Whitworth, Trapezoidal, Buttress, pipe gauge limits).
4. Internal minor-diameter tolerance per ASME B1.1; UNJ controlled root radius; STI insert oversize.
5. CSV/clipboard export, terminology graphic popups, designation polish (UNC/UNF series labels).

## Acknowledgement

ME ThreadPal was created by **Michael Rainey** of Close Tolerance Software. This project exists to
keep that resource alive and cross-platform. The original program, its help files, and its UI art
are **not** included here; this is an independent reconstruction from public standards.
