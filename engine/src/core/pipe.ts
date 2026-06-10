/**
 * Pipe threads.
 *  - NPT / NPTF  : American taper pipe, 60°, taper 1:16 (0.0625"/in on dia) — ASME B1.20.1.
 *  - BSPT        : ISO taper pipe (Whitworth 55° form), taper 1:16 — ISO 7-1.
 *  - NPSM / NPSL : American straight pipe, 60° — ASME B1.20.1.
 *  - BSPP        : ISO parallel pipe (Whitworth 55° form) — ISO 7-1.
 *
 * Input carries pipe OD as `majorDiameter` and threads-per-inch as `tpi` (from the catalog).
 *
 * Taper threads (validated against the published 1/16-27 NPT row) report dimensions at two
 * planes — the pipe face (small end, plane of E0) and the gauge notch (hand-tight plane, E1):
 *   p  = 1/n
 *   E0 = D − (0.05·D + 1.1)·p                         (pitch dia, pipe face)
 *   E1 = E0 + 0.0625·L1                               (pitch dia, gauge notch; L1 from B1.20.1)
 *   heightMean = (0.866025 − 0.033 − 0.097)·p         (mean truncated thread height)
 *   major = pitch + heightMean,  minor = pitch − heightMean   (per plane)
 *   truncation crest/root = [0.033·p, 0.097·p];  flat = 1.1547 × truncation
 */

import type { ThreadInput, ThreadResult, TaperResult } from "../types.js";
import { roundInch } from "./round.js";
import { fundamentalHeight, leadAngleDeg, bestWire, measurementOverWires } from "./geometry.js";
import { lookupNptLengths } from "../data/pipe.js";
import { DRILLS } from "../data/drills.js";

const TRUNC_MIN = 0.033;
const TRUNC_MAX = 0.097;
const FLAT_FROM_TRUNC = 1.1547; // 2 tan(30°)

export function derivePipe(input: ThreadInput): ThreadResult {
  const fam = input.family;
  const taper = fam === "NPT" || fam === "NPTF" || fam === "BSPT";
  if (taper) return deriveTaperPipe(input);
  return deriveStraightPipe(input);
}

function deriveTaperPipe(input: ThreadInput): ThreadResult {
  const D = input.majorDiameter;
  const n = input.tpi ?? (input.pitch ? 1 / input.pitch : 0);
  const p = 1 / n;
  const fam = input.family;
  const angle = fam === "BSPT" ? 55 : 60;
  const notes: string[] = [];

  const E0 = D - (0.05 * D + 1.1) * p;
  const lengths = lookupNptLengths(D, n);
  const L1 = lengths?.L1 ?? (0.8 * D + 6.8) * p; // table value; fallback approx for custom OD
  const L2 = lengths?.L2 ?? (0.8 * D + 6.8) * p;
  const L4 = lengths?.L4 ?? L2 * 1.1;
  if (!lengths) notes.push("Custom taper pipe size — engagement lengths approximate (no B1.20.1 row).");
  const L3 = Math.max(0, L2 - L1); // wrench makeup beyond hand-tight (derived)
  const E1 = E0 + 0.0625 * L1;

  // Crest/root truncation coefficients (× p). NPT/BSPT crests and roots are equal; NPTF (Dryseal,
  // ASME B1.20.3) truncates roots MORE than crests so metal-to-metal sealing occurs at crests/roots.
  // (NPTF data point validated: 18 TPI crest 0.0026–0.0043, root 0.0043–0.0061 inch.)
  const isNPTF = fam === "NPTF";
  const crestT = isNPTF ? [0.047, 0.077] : [TRUNC_MIN, TRUNC_MAX];
  const rootT = isNPTF ? [0.077, 0.11] : [TRUNC_MIN, TRUNC_MAX];
  const H = 0.8660254;
  const crestMean = (crestT[0] + crestT[1]) / 2;
  const rootMean = (rootT[0] + rootT[1]) / 2;
  const majDepth = (H - 2 * crestMean) * p; // pitch dia → major dia
  const minDepth = (H - 2 * rootMean) * p; // pitch dia → minor dia
  const heightMean = (majDepth + minDepth) / 2;
  const majorFace = E0 + majDepth;
  const majorGage = E1 + majDepth;
  const minorFace = E0 - minDepth;
  const minorGage = E1 - minDepth;

  const truncCrest = { max: roundInch(crestT[1] * p), min: roundInch(crestT[0] * p) };
  const truncRoot = { max: roundInch(rootT[1] * p), min: roundInch(rootT[0] * p) };
  // Flats derived from the (rounded) truncations, matching the original's displayed values.
  const flatCrest = { max: roundInch(FLAT_FROM_TRUNC * truncCrest.max), min: roundInch(FLAT_FROM_TRUNC * truncCrest.min) };
  const flatRoot = { max: roundInch(FLAT_FROM_TRUNC * truncRoot.max), min: roundInch(FLAT_FROM_TRUNC * truncRoot.min) };

  // Tap drill: nearest standard drill to the required hole (minor at the pipe-face plane).
  const requiredHole = minorFace;
  const drill = nearestDrill(requiredHole);
  const tapDepthRef = roundInch(L4 + L1); // reference drilling depth (approx)

  const taperResult: TaperResult = {
    pipeDiameter: roundInch(D),
    external: {
      major: { pipeFace: roundInch(majorFace), gageNotch: roundInch(majorGage) },
      pitch: { pipeFace: roundInch(E0), gageNotch: roundInch(E1) },
      minor: { pipeFace: roundInch(minorFace), gageNotch: roundInch(minorGage) },
    },
    internal: {
      minor: { pipeEndL1: roundInch(minorFace), pipeFace: roundInch(minorGage) },
      pitchGageNotch: roundInch(E1),
      tapDrill: roundInch(drill.inch),
      tapDrillName: drill.name,
      tapDepthRef,
    },
    flat: { crest: flatCrest, root: flatRoot },
    truncation: { crest: truncCrest, root: truncRoot },
    lengths: { L1: roundInch(L1), L2: roundInch(L2), L3: roundInch(L3), L4: roundInch(L4) },
    heightMean: roundInch(heightMean),
    mowGageNotch: roundInch(measurementOverWires(E1, bestWire(p, angle), p, angle)),
  };

  notes.push(`Taper pipe ${fam} (1:16). Tap depth is a reference value; tolerances are gauge-based.`);

  const la = leadAngleDeg(p, E1);
  const label: Record<string, string> = { NPT: "NPT", NPTF: "NPTF", BSPT: "R" };
  return {
    family: fam,
    designation: `${D.toFixed(4)}-${n} ${label[fam] ?? fam}`,
    units: "inch",
    pitch: p,
    tpi: n,
    threadAngleDeg: angle,
    classOfFit: input.classOfFit,
    starts: 1,
    lead: p,
    leadAngleDeg: la,
    helixAngleDeg: 90 - la,
    fundamentalHeight: fundamentalHeight(p, angle),
    threadHeight: roundInch(heightMean),
    allowance: 0,
    // Provide flat external/internal limit fields too (using gauge-plane values) for any
    // generic consumers, but the taper object is the authoritative source for the UI.
    majorDiameter: { basic: roundInch(majorGage), external: { max: roundInch(majorGage), min: roundInch(majorFace) }, internal: { max: NaN, min: roundInch(majorGage) } },
    pitchDiameter: { basic: roundInch(E1), external: { max: roundInch(E1), min: roundInch(E0) }, internal: { max: roundInch(E1), min: roundInch(E0) } },
    minorDiameter: { basic: roundInch(minorGage), external: { max: roundInch(minorGage), min: roundInch(minorFace) }, internal: { max: NaN, min: roundInch(minorFace) } },
    taper: taperResult,
    notes,
  };
}

/**
 * Straight (parallel) pipe threads.
 *  - NPSM (free-fitting mechanical) and NPSL (loose-fitting, locknut) — ASME B1.20.1.
 *    Both share the NPT 60° form. NPSM pitch diameter is the NPT gauge-plane value (E1); NPSL is
 *    larger by design (largest thread on standard pipe): E1 + P/4 with a 1.5-turn tolerance.
 *    (Validated vs B1.20.1: 1/2-14 NPSM 0.7769/0.7718, NPSL 0.7963/0.7896.)
 *  - BSPP — ISO 7-1 parallel pipe (55° Whitworth form), provisional.
 */
function deriveStraightPipe(input: ThreadInput): ThreadResult {
  const D = input.majorDiameter;
  const n = input.tpi ?? (input.pitch ? 1 / input.pitch : 0);
  const p = 1 / n;
  const fam = input.family;
  const notes: string[] = [];

  let angle: number;
  let pitchBasic: number;
  let extMax: number, extMin: number, intMin: number, intMax: number;

  if (fam === "BSPP") {
    angle = 55;
    pitchBasic = D - 0.640327 * p;
    extMax = pitchBasic; extMin = pitchBasic - 0.05 * p;
    intMin = pitchBasic; intMax = pitchBasic + 0.05 * p;
    notes.push("BSPP parallel pipe (ISO 7-1, 55° form); tolerances provisional.");
  } else {
    angle = 60;
    const E0 = D - (0.05 * D + 1.1) * p;
    const len = lookupNptLengths(D, n);
    const L1 = len?.L1 ?? (0.8 * D + 6.8) * p;
    const E1 = E0 + 0.0625 * L1;
    if (!len) notes.push("Custom straight-pipe size — pitch diameter approximate (no B1.20.1 row).");
    if (fam === "NPSL") {
      pitchBasic = E1 + 0.25 * p; // largest thread on standard pipe
      const tol = 0.09375 * p; // 1.5 turns x 0.0625 P
      extMax = pitchBasic; extMin = pitchBasic - tol;
      intMin = pitchBasic; intMax = pitchBasic + tol;
      notes.push("NPSL (loose-fitting, locknut) per ASME B1.20.1: pitch diameter E1 + P/4, ±1.5-turn tolerance.");
    } else {
      pitchBasic = E1; // NPSM at the NPT gauge plane
      const allow = 0.0015; const tol = 0.005; // approximate B1.20.1 free-fit limits
      extMax = E1 - allow; extMin = extMax - tol;
      intMin = E1; intMax = E1 + tol;
      notes.push("NPSM (free-fitting mechanical) per ASME B1.20.1: pitch diameter at the NPT gauge plane (E1); tolerances approximate.");
    }
  }

  const hHalf = (angle === 55 ? 0.640327 : 0.736025) * p; // pitch dia -> major/minor (diametral)
  const major = pitchBasic + hHalf;
  const minor = pitchBasic - hHalf;
  const la = leadAngleDeg(p, pitchBasic);
  const label: Record<string, string> = { NPSM: "NPSM", NPSL: "NPSL", BSPP: "G" };
  return {
    family: fam,
    designation: `${D.toFixed(3)}-${n} ${label[fam] ?? fam}`,
    units: "inch",
    pitch: p,
    tpi: n,
    threadAngleDeg: angle,
    classOfFit: input.classOfFit,
    starts: 1,
    lead: p,
    leadAngleDeg: la,
    helixAngleDeg: 90 - la,
    fundamentalHeight: fundamentalHeight(p, angle),
    threadHeight: roundInch(hHalf),
    allowance: 0,
    majorDiameter: { basic: roundInch(major), external: { max: roundInch(major), min: roundInch(major - 0.02 * p) }, internal: { max: NaN, min: roundInch(major) } },
    pitchDiameter: { basic: roundInch(pitchBasic), external: { max: roundInch(extMax), min: roundInch(extMin) }, internal: { max: roundInch(intMax), min: roundInch(intMin) } },
    minorDiameter: { basic: roundInch(minor), external: { max: roundInch(minor), min: NaN }, internal: { max: NaN, min: roundInch(minor) } },
    notes,
  };
}

/** Largest standard drill not exceeding the required hole (leaves full thread material). */
function nearestDrill(targetInch: number): { name: string; inch: number } {
  let best = DRILLS[0];
  for (const d of DRILLS) {
    if (d.inch <= targetInch + 1e-9 && d.inch > best.inch) best = d;
  }
  return best;
}
