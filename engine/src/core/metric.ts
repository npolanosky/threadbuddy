/**
 * ISO metric M-profile screw threads — ISO 965-1 / ASME B1.13M.
 *
 * Basic dimensions are exact (validated). Fundamental deviations use the ISO 965-1 formulas
 * (es(g) = -(15 + 11P) µm, verified: P=1.5 -> -32 µm). Grade tolerances are computed from the
 * ISO base formula with the standard R10 grade multipliers; published ISO tables round these to
 * the R40 preferred-number series, so computed tolerances can differ from table values by ~1 µm.
 * This precision status is recorded in the coverage matrix.
 *
 * Validation anchor — M10 x 1.5:
 *   basic pitch diameter 9.0257, basic minor (internal D1) 8.3766
 *   6g pitch diameter 8.994 / 8.862 (es(g) = -0.032, Td2(6) ~ 0.132)
 */

import type { ThreadInput, ThreadResult } from "../types.js";
import { roundMetric } from "./round.js";
import {
  fundamentalHeight,
  leadAngleDeg,
  bestWire,
  measurementOverWires,
  wireConstant,
  WIRE_MAX_FACTOR_60,
  WIRE_MIN_FACTOR_60,
} from "./geometry.js";
import { buildTapDrillInfo, alternateWire } from "./features.js";

const PD_COEFF = 0.6495190528; // pitch dia  = D - 0.649519 P
const MINOR_INT_COEFF = 1.0825317547; // internal minor D1 = D - 1.082532 P
const MINOR_EXT_COEFF = 1.2268699; // external minor d3 (rounded root) = D - 1.226870 P
const MINOR_EXT_SHARP = 1.7320508076; // sharp external minor = D - 2H

/** Round a value in micrometres to the nearest whole µm and return millimetres (ISO 965-1). */
const umToMm = (um: number): number => Math.round(um) / 1000;

/** External fundamental deviation es (mm, negative) by tolerance position letter. P in mm. */
function esExternal(position: string, P: number): number {
  switch (position) {
    case "e":
      return -umToMm(50 + 11 * P);
    case "f":
      return -umToMm(30 + 11 * P);
    case "g":
      return -umToMm(15 + 11 * P);
    case "h":
      return 0;
    default:
      return 0;
  }
}

/** Internal fundamental deviation EI (mm, >=0) by tolerance position letter. */
function eiInternal(position: string, P: number): number {
  switch (position) {
    case "G":
      return umToMm(15 + 11 * P);
    case "H":
      return 0;
    default:
      return 0;
  }
}

/** Grade multipliers relative to grade 6 (R10 series), ISO 965-1. */
const GRADE_FACTOR: Record<number, number> = {
  3: 0.5,
  4: 0.63,
  5: 0.8,
  6: 1.0,
  7: 1.25,
  8: 1.6,
  9: 2.0,
};

/** External pitch-diameter tolerance, grade 6 (mm). ISO 965-1 base formula. */
function td2grade6(P: number, d: number): number {
  return 0.09 * Math.pow(P, 0.4) * Math.pow(d, 0.1);
}

/** External crest (major) diameter tolerance, grade 6 (mm). */
function tdGrade6Major(P: number): number {
  // ISO 965-1: Td(6) = 0.18 * P^(2/3) - 0.015 * P^(-1/2)  (approx; rounded to R40 in tables)
  return 0.18 * Math.pow(P, 2 / 3) - 0.015 * Math.pow(P, -0.5);
}

/** Internal minor diameter tolerance, grade 6 (mm). ISO 965-1 approximation (R40 in tables). */
function td1Grade6Minor(P: number): number {
  // Reasonable closed-form fit to ISO 965-1 TD1(6) over common pitches (0.2–6 mm).
  return 0.23 * Math.pow(P, 2 / 3) + 0.16 * P;
}

/** Parse a metric class such as "6g", "6H", "5g6g", "4H5H". Returns pitch-dia grade+position. */
function parseMetricClass(cls: string): { grade: number; position: string; external: boolean } {
  const m = cls.match(/^(\d)([a-hA-H])/);
  const grade = m ? parseInt(m[1], 10) : 6;
  const position = m ? m[2] : "g";
  const external = position === position.toLowerCase();
  return { grade, position, external };
}

export function deriveMetric(input: ThreadInput): ThreadResult {
  const notes: string[] = [];
  const D = input.majorDiameter;
  const P = input.pitch ?? (input.tpi ? 25.4 / input.tpi : 0);
  const starts = input.starts ?? 1;
  const { grade, position, external } = parseMetricClass(input.classOfFit);

  const sharp = input.sharpRoot ?? false;
  // MJ profile (ASME B1.21M / ISO 5855): mandatory external root radius and increased minor
  // diameters giving a basic thread height of 0.5625H (vs 0.625H for M).
  const isMJ = input.family === "MJ";
  const H = fundamentalHeight(P, 60);
  const basicPitch = D - PD_COEFF * P;
  const basicMinorInternal = isMJ ? D - 0.97428 * P : D - MINOR_INT_COEFF * P;
  const basicMinorExternal = isMJ
    ? D - 1.19078 * P
    : D - (sharp ? MINOR_EXT_SHARP : MINOR_EXT_COEFF) * P;

  const majorDiameter: ThreadResult["majorDiameter"] = { basic: roundMetric(D) };
  const pitchDiameter: ThreadResult["pitchDiameter"] = { basic: roundMetric(basicPitch) };
  const minorDiameter: ThreadResult["minorDiameter"] = {
    basic: roundMetric(external ? basicMinorExternal : basicMinorInternal),
  };

  const factor = GRADE_FACTOR[grade] ?? 1;

  if (external) {
    const es = esExternal(position, P);
    const td2 = roundMetric(td2grade6(P, D) * factor);
    const tdMaj = roundMetric(tdGrade6Major(P) * factor);
    const pdMax = roundMetric(basicPitch + es);
    const pdMin = roundMetric(pdMax - td2);
    pitchDiameter.external = { max: pdMax, min: pdMin };
    const majMax = roundMetric(D + es);
    majorDiameter.external = { max: majMax, min: roundMetric(majMax - tdMaj) };
    minorDiameter.external = { max: roundMetric(basicMinorExternal + es), min: NaN };
    notes.push("Metric crest tolerances computed (may differ ~1 µm from ISO R40 table).");
  } else {
    const ei = eiInternal(position, P);
    const td2 = roundMetric(td2grade6(P, D) * factor * 1.32); // internal/external ratio ~1.32
    const td1 = roundMetric(td1Grade6Minor(P) * factor);
    const pdMin = roundMetric(basicPitch + ei);
    pitchDiameter.internal = { max: roundMetric(pdMin + td2), min: pdMin };
    const minorMin = roundMetric(basicMinorInternal + ei);
    minorDiameter.internal = { max: roundMetric(minorMin + td1), min: minorMin };
    majorDiameter.internal = { max: NaN, min: roundMetric(D + ei) };
    notes.push("Metric tolerances computed (may differ ~1 µm from ISO R40 table).");
  }

  let wires: ThreadResult["wires"];
  if (external && pitchDiameter.external) {
    const w = bestWire(P, 60);
    const e = pitchDiameter.external;
    const majMax = majorDiameter.external?.max ?? D;
    wires = {
      bestWire: roundMetric(w),
      minWire: roundMetric(WIRE_MIN_FACTOR_60 * P),
      maxWire: roundMetric(WIRE_MAX_FACTOR_60 * P),
      constantBest: roundMetric(wireConstant(w, P, 60)),
      mow: {
        max: roundMetric(measurementOverWires(e.max, w, P, 60)),
        min: roundMetric(measurementOverWires(e.min, w, P, 60)),
      },
    };
    if (input.alternateWire) {
      wires.alternate = alternateWire(e, input.alternateWire, P, 60, majMax, roundMetric);
    }
  }

  const lead = starts * P;
  const la = leadAngleDeg(lead, basicPitch);
  const tapType = input.tapType ?? "cut";
  const targetPercent = input.targetPercent ?? 75;
  const tapDrillInfo = !external ? buildTapDrillInfo(D, P, "metric", targetPercent, tapType) : undefined;
  // Root flat / radius for the ISO metric form (rounded external root).
  const flatAtRoot = { external: sharp ? 0 : roundMetric(P / 8), internal: sharp ? 0 : roundMetric(P / 4) };
  const rootRadius = isMJ
    ? { max: roundMetric(0.18042 * P), min: roundMetric(0.15011 * P) }
    : { max: roundMetric(0.14434 * P), min: roundMetric(0.125 * P) };
  if (isMJ) {
    notes.push("MJ profile (B1.21M/ISO 5855): controlled external root radius 0.15011–0.18042P; minor diameters increased (basic height 0.5625H).");
  }

  const startTag = starts > 1 ? ` (${starts}-start)` : "";
  const prefix = isMJ ? "MJ" : "M";
  return {
    family: input.family,
    designation: `${prefix}${trimNum(D)}×${trimNum(P)}-${input.classOfFit}${startTag}`,
    units: "metric",
    pitch: P,
    tpi: 25.4 / P,
    threadAngleDeg: 60,
    classOfFit: input.classOfFit,
    starts,
    lead,
    leadAngleDeg: la,
    helixAngleDeg: 90 - la,
    fundamentalHeight: H,
    threadHeight: roundMetric((isMJ ? 0.5625 : 0.625) * H),
    allowance: external ? Math.abs(esExternal(position, P)) : 0,
    majorDiameter,
    pitchDiameter,
    minorDiameter,
    flatAtRoot,
    rootRadius,
    wires,
    tapDrill: tapDrillInfo ? roundMetric(tapDrillInfo.theoretical) : undefined,
    tapDrillInfo,
    notes,
  };
}

function trimNum(n: number): string {
  return n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
