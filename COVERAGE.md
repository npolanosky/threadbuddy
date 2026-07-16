# Coverage & Data Integrity

ThreadBuddy reconstructs thread dimensions from public standards and validates them against the
standards' published tables. The test suite currently has 313 passing checks; the in-app Notes panel
flags any value that is provisional.

## Validation anchors

- **Unified (ASME B1.1):** 1/2-13 UNC reproduced exactly — 2A pitch dia 0.4485/0.4435, allowance
  0.0015, major 0.4985/0.4876; 2B pitch dia 0.4565/0.4500; internal minor min 0.4167 — using length
  of engagement = basic major diameter and ASME B1.30 rounding.
- **Metric (ISO 965):** M10 x 1.5 basic dimensions exact; fundamental deviation es(g) = -0.032 at
  P = 1.5.
- **Taper pipe (ASME B1.20.1):** 1/16-27 NPT reproduced — pitch 0.2712/0.2812, major 0.2985/0.3085,
  minor 0.2439/0.2539, mean height 0.0273, tap drill C, L1/L2/L4 = 0.160/0.2611/0.2875.

## Status legend

- **Validated** — output matches the published standard tables.
- **Geometry** — basic dimensions validated; tolerance limits are provisional.
- **Provisional** — implemented from the standard's formulas but not yet table-validated (flagged
  in-app).

## Thread families

| Family | Standard | Status | Notes |
|---|---|---|---|
| UN / UNC / UNF / UNEF / UNS | ASME B1.1-2003 | Validated | pitch, major, allowance per published rows |
| UNR (rounded root) | ASME B1.1-2003 | Validated | shares the UN engine |
| UNJ | SAE AS8879C-2003 | Geometry | controlled root radius 0.15011–0.18042P; increased minor diameters (basic height 0.5625H) |
| Metric M / MS | ISO 965-1 / ASME B1.13M | Geometry | basic exact; tolerances ~1 µm vs ISO R40 table |
| Metric MJ | ASME B1.21M / ISO 5855 | Geometry | controlled root radius 0.15011–0.18042P; increased minor diameters |
| Acme — GP / Centralizing / Stub | ASME B1.5-1997 | Geometry | tolerances provisional |
| Whitworth — BSW / BSF | BS 84:1956 | Geometry | 55° form; tolerances provisional |
| ISO Metric Trapezoidal | ISO 2901 | Geometry | 30° form; tolerances provisional |
| US Buttress 7°/45° / ISO 3°/30° | ASME B1.9 / DIN 513 | Provisional | asymmetric geometry approximate |
| NPT / NPTF (taper) | ASME B1.20.1 / B1.20.3 | Validated geometry | pipe-face & gage-notch dims, flats, truncation, L1–L4; NPTF distinct from NPT |
| NPSM / NPSL (straight) | ASME B1.20.1 | Geometry | distinct: NPSM at NPT gauge plane (E1), NPSL = E1 + P/4 (validated vs 1/2-14) |
| BSPT / BSPP | ISO 7-1 | Provisional | 55° form; ISO 7 formulas pending |
| UNM (miniature) | ASME B1.10 | Geometry | millimetre-based |
| STI — Unified / Metric | ASME B18.29.1 / B18.29.2M / DIN 8140-2 | Validated (internal) | tapped hole = UN/M thread at D' = D + 1.299038p; internal limits (2B/3B, 5H/4H5H) tabulated & verified vs HC-2000 Rev 11. Inch UNC #1-64…1-8 (18) + UNF #4-48…1-12 (14); metric coarse M2–M24 (14) + fine M8×1…M24×2 (9) + tap-drill data |
| Pg conduit | DIN 40430 | Geometry | millimetre-based |

Built-in size catalog: roughly 335 standard sizes across these families. Custom diameter/pitch entry
is supported for every family.

## Features

External/internal dimension tables (max/min/mean/tol), flat at root and root radius, sharp-root
option, allowance, basic thread height; measurement over wires (best/max/min wire, constant, MOW
limits) with a user alternate wire that updates the main MOW; starts / pitch / lead with a
lead-or-helix angle; length of engagement; tap drills with cut/form selection, a thread-percent
target, and a nearest-standard-drill table; a coating/polishing panel (before/after, 4x rule, ±
thickness tolerance band, internal/external); a Fusion PDO (Ø) field (diametric pitch-diameter
offset = major − minor for Autodesk Fusion's Thread toolpath, shown per hand); inch or metric
display; print; reset to default.

Tapered pipe threads use a dedicated layout (pipe-face/gage-notch values, pipe diameter, flats and
truncation, internal pipe-end-L1/pipe-face minor, gage-notch pitch, tap drill and reference depth,
and engagement lengths L1–L4), with thread percent, length of engagement, and form tap disabled.

## Roadmap

1. Exact ISO 965 R40 tolerance tables for metric limits.
2. Full ASME B1.5 Acme tolerance tables.
3. Per-standard tolerance tables for Whitworth, Trapezoidal, Buttress, and the pipe families.
4. Internal minor-diameter tolerance per ASME B1.1; UNJ controlled root radius.
5. CSV / clipboard export and terminology graphics.
