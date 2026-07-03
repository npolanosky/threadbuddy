# Provenance, Data Sources & Methodology

## Why this project exists

[ME ThreadPal](https://archive.org/details/methread-pal-setup) by **Michael Rainey**
(*Close Tolerance Software*, ~2009) is a comprehensive, much-loved Windows screw-thread
data calculator. Its author has passed away, the company website has lapsed, and the
program is now archived on the Internet Archive under a **Public Domain Mark 1.0**. It runs
only on Windows and increasingly suffers compatibility issues on modern systems.

ThreadBuddy is a **clean-room reimplementation** that recreates ME ThreadPal's
*functionality and data* as a cross-platform, install-free web app, so this resource stays
available to machinists on any OS. We gratefully acknowledge Michael Rainey's original work.

## Clean-room approach

- The original program was built with **Emergence BASIC** as a native Win32 binary.
  It is **not practically decompilable** into trustworthy source, and its data tables are
  **computed at runtime**, not stored verbatim — so nothing is (or could be) copied from the
  binary.
- Instead, we **reconstruct every calculation directly from the published engineering
  standards** that ME ThreadPal itself cites (see table below), and **validate** our output
  against the same published standard tables.
- The original binaries and decompiled help files are kept **out of this repository**
  (gitignored under `reference/`). They are used only as a development reference for *which
  standard governs each thread type* and *which behaviors/defaults to mirror* — never copied.

## Legal basis

Screw-thread dimensions are **facts** derived from public standards, and mathematical
**formulas** are not copyrightable. The original package is additionally marked Public Domain.
Our own source code is MIT-licensed (see `LICENSE`).

## Governing standards per thread type

(Recorded from the original's documentation; these are the references we reconstruct from.)

| Thread type | Governing standard |
|---|---|
| UN / UNC / UNF / UNEF / UNS | ASME B1.1-2003 |
| UNR / UNRC / UNRF / UNREF / UNRS | ASME B1.1-2003 |
| UNJ / UNJC / UNJF / UNJEF / UNJS | SAE AS8879C-2003 |
| UNM — Unified Miniature | ASME B1.10-1958 (R1988) |
| Acme — General Purpose / Centralizing / Stub | ASME B1.5-1997 |
| U.S. Buttress 7°×45° | ASME B1.9-1973 (R1992) |
| Metric M / MS Profile | ASME B1.13M-2005, ISO 965:1998 |
| Metric MJ / MJS Profile | ASME B1.21M-1997, ISO 5855:1988 |
| ISO Metric Trapezoidal | ISO 2901:1993 |
| ISO Metric Buttress 3°×30° | DIN 513-1985 |
| Whitworth — BSW / BSF / Special | BS 84:1956 |
| Taper Pipe NPT | ASME B1.20.1-1983 (R2001) |
| Dryseal Taper Pipe NPTF | ASME B1.20.1 / B1.20.3 |
| NPSM — straight pipe (mechanical) | ASME B1.20.1-1983 (R2001) |
| NPSL — straight pipe (locknut) | ASME B1.20.1-1983 (R2001) |
| ISO Taper Pipe (BSPT) | ISO 7-1:1994 |
| ISO Parallel Pipe (BSPP) | ISO 7-1:1994 |
| STI — Screw Thread Insert (Unified & Metric) | ASME B18.29.1-2010 (inch) / B18.29.2M-2005 (metric) |
| Pg — Metric Conduit | DIN 40430-1971 |

## Data-integrity methodology

Integrity is the top priority. Every computed value is checked two ways:

1. **Per-row fixture tests** — authoritative rows digitized from the published standard tables
   (with per-table citations) live in `engine/reference-tables/`. Tests assert the engine
   reproduces each row to the standard's stated precision.
2. **Invariant / property tests** — formula identities are checked across the full computed
   range (e.g. UN pitch dia = D − 0.6495·P; helix angle = atan(lead / (π·d₂))), catching
   systematic errors that spot-checks miss.
3. **Worked-example fixtures** — examples from the original's documentation (e.g. a 4-start
   GP-Acme 1.000-5 → lead angle 15.865°) are encoded as additional checks.
4. **Coverage audit** (`tools/audit_coverage.py`) — reports, per thread type, how many
   sizes/classes are backed by a cited reference. Gaps are surfaced in the README, never hidden.

Any thread type whose standard data cannot be fully sourced is **flagged as provisional** in
the README rather than shipped as if verified.
