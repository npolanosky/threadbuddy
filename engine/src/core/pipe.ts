/**
 * Pipe threads.
 *  - NPT / NPTF  : American taper pipe, 60°, taper 1:16 (0.0625"/in on dia) — ASME B1.20.1.
 *  - NPSM / NPSL : American straight pipe, 60° — ASME B1.20.1.
 *  - BSPT        : ISO taper pipe (Whitworth 55° form), taper 1:16 — ISO 7-1.
 *  - BSPP        : ISO parallel pipe (Whitworth 55° form) — ISO 7-1.
 *
 * Input carries the pipe OD as `majorDiameter` and the threads-per-inch as `tpi` (from the pipe
 * catalog). Taper-thread pitch diameters are reported at the small end (E0) and at the gauge plane
 * (E1) per the B1.20.1 formulas:
 *   p  = 1/n
 *   E0 = D − (0.05·D + 1.1)·p          (pitch dia at end of pipe)
 *   L1 = (0.80·D + 6.8)·p              (hand-tight engagement length)
 *   E1 = E0 + 0.0625·L1                (pitch dia at gauge plane)
 *   h  = 0.8·p                         (thread height, truncated 60°)
 * Tolerances are provisional (gauge-based in the standard); basic dimensions are authoritative.
 */

import type { ThreadInput, ThreadResult } from "../types.js";
import { roundInch } from "./round.js";
import { fundamentalHeight, leadAngleDeg } from "./geometry.js";

export function derivePipe(input: ThreadInput): ThreadResult {
  const D = input.majorDiameter; // pipe outside diameter
  const n = input.tpi ?? (input.pitch ? 1 / input.pitch : 0);
  const p = 1 / n;
  const fam = input.family;
  const taper = fam === "NPT" || fam === "NPTF" || fam === "BSPT";
  const angle = fam === "BSPT" || fam === "BSPP" ? 55 : 60;
  const depthCoeff = angle === 55 ? 0.640327 : 0.8; // 55° Whitworth depth vs 60° truncated NPT
  const notes: string[] = [];

  const h = depthCoeff * p;
  let pitchGauge: number; // E1
  let pitchEnd: number; // E0
  if (taper) {
    pitchEnd = D - (0.05 * D + 1.1) * p;
    const L1 = (0.8 * D + 6.8) * p;
    pitchGauge = pitchEnd + 0.0625 * L1;
    notes.push("Taper pipe thread (1:16). Pitch dia shown at gauge plane (E1) and pipe end (E0).");
  } else {
    // Straight pipe: pitch diameter from 60°/55° form at the nominal.
    pitchGauge = D - (angle === 55 ? 0.640327 : 0.64952) * p;
    pitchEnd = pitchGauge;
  }
  notes.push(`Pipe thread tolerances provisional (standard is gauge-based: ${fam}).`);

  const minor = pitchGauge - h;
  const major = D;

  const majorDiameter: ThreadResult["majorDiameter"] = {
    basic: roundInch(major),
    external: { max: roundInch(major), min: roundInch(major - h * 0.1) },
    internal: { max: NaN, min: roundInch(major) },
  };
  const pitchDiameter: ThreadResult["pitchDiameter"] = {
    basic: roundInch(pitchGauge),
    external: { max: roundInch(pitchGauge), min: roundInch(pitchEnd) },
    internal: { max: roundInch(pitchGauge), min: roundInch(pitchEnd) },
  };
  const minorDiameter: ThreadResult["minorDiameter"] = {
    basic: roundInch(minor),
    external: { max: roundInch(minor), min: NaN },
    internal: { max: NaN, min: roundInch(minor) },
  };

  const la = leadAngleDeg(p, pitchGauge);
  const label: Record<string, string> = {
    NPT: "NPT", NPTF: "NPTF", NPSM: "NPSM", NPSL: "NPSL", BSPT: "R", BSPP: "G",
  };

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
    majorDiameter,
    pitchDiameter,
    minorDiameter,
    notes,
  };
}
