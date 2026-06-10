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

  const heightMean = (0.8660254 - TRUNC_MIN - TRUNC_MAX) * p;
  const majorFace = E0 + heightMean;
  const majorGage = E1 + heightMean;
  const minorFace = E0 - heightMean;
  const minorGage = E1 - heightMean;

  const truncCrest = { max: roundInch(TRUNC_MAX * p), min: roundInch(TRUNC_MIN * p) };
  const truncRoot = { ...truncCrest };
  const flatCrest = { max: roundInch(TRUNC_MAX * p * FLAT_FROM_TRUNC), min: roundInch(TRUNC_MIN * p * FLAT_FROM_TRUNC) };
  const flatRoot = { ...flatCrest };

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
    helixAngleDeg: la,
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

function deriveStraightPipe(input: ThreadInput): ThreadResult {
  const D = input.majorDiameter;
  const n = input.tpi ?? (input.pitch ? 1 / input.pitch : 0);
  const p = 1 / n;
  const fam = input.family;
  const angle = fam === "BSPP" ? 55 : 60;
  const coeff = angle === 55 ? 0.640327 : 0.64952;
  const pitch = D - coeff * p;
  const h = (angle === 55 ? 0.640327 : 0.8) * p;
  const minor = pitch - h / 2;
  const notes = [`Straight pipe thread ${fam}; tolerances provisional (gauge-based in the standard).`];

  const la = leadAngleDeg(p, pitch);
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
    helixAngleDeg: la,
    fundamentalHeight: fundamentalHeight(p, angle),
    threadHeight: roundInch(h),
    allowance: 0,
    majorDiameter: { basic: roundInch(D), external: { max: roundInch(D), min: roundInch(D - 0.05 * p) }, internal: { max: NaN, min: roundInch(D) } },
    pitchDiameter: { basic: roundInch(pitch), external: { max: roundInch(pitch), min: roundInch(pitch - 0.05 * p) }, internal: { max: roundInch(pitch + 0.05 * p), min: roundInch(pitch) } },
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
