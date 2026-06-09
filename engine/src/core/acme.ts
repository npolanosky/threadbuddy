/**
 * Acme and Stub Acme screw threads — ASME B1.5-1997 (29° included angle).
 *
 * General Purpose / Centralizing: basic thread height h = p/2; Stub Acme: h = 0.3p.
 * Basic pitch diameter E = D - h ... measured radially the pitch line sits at mid-height, so
 * E = D - 0.5p (GP) and E = D - 0.3p (Stub).  External allowance es = 0.020·sqrt(P) (B1.5).
 *
 * Validation note: the original ME ThreadPal documents a 4-start 1.000-5 GP Acme (class 4G)
 * lead angle of 15.865°, which corresponds to an allowance-adjusted pitch diameter. We compute
 * the geometrically-standard lead angle at the basic pitch diameter (~15.80° for that case);
 * the small difference and its origin are recorded in the coverage matrix.
 */

import type { ThreadInput, ThreadResult } from "../types.js";
import { roundInch } from "./round.js";
import {
  fundamentalHeight,
  leadAngleDeg,
  bestWire,
  measurementOverWires,
  wireConstant,
} from "./geometry.js";
import { alternateWire } from "./features.js";

const ACME_ANGLE = 29;

export function deriveAcme(input: ThreadInput): ThreadResult {
  const notes: string[] = [];
  const D = input.majorDiameter;
  const tpi = input.tpi ?? (input.pitch ? 1 / input.pitch : 0);
  const p = input.pitch ?? 1 / tpi;
  const stub = input.family === "STUB_ACME";
  const cls = input.classOfFit.toUpperCase();
  const external = cls.endsWith("G") || cls.endsWith("E"); // 2G/3G/4G external; 2C/3C/4C nut... handled below
  const starts = input.starts ?? 1;

  const h = (stub ? 0.3 : 0.5) * p; // basic thread height
  const basicPitch = D - (stub ? 0.3 : 0.5) * p; // pitch line at mid-height -> D - h (GP), D - 0.3p (Stub)
  const basicMinor = D - 2 * h; // = D - p (GP), D - 0.6p (Stub)

  const allowance = roundInch(0.02 * Math.sqrt(p)); // B1.5 external allowance

  const majorDiameter: ThreadResult["majorDiameter"] = { basic: roundInch(D) };
  const pitchDiameter: ThreadResult["pitchDiameter"] = { basic: roundInch(basicPitch) };
  const minorDiameter: ThreadResult["minorDiameter"] = { basic: roundInch(basicMinor) };

  // Per-class pitch-diameter tolerance (B1.5): tol = factor * 0.040 * sqrt(p) approx;
  // 2G loosest, 4G tightest. Recorded as provisional pending full B1.5 table validation.
  const pdTolBase = 0.04 * Math.sqrt(p);
  const clsNum = parseInt(cls[0] ?? "2", 10);
  const pdTolFactor = clsNum === 2 ? 1 : clsNum === 3 ? 0.71 : 0.5;
  const pdTol = roundInch(pdTolBase * pdTolFactor);

  if (external) {
    const pdMax = roundInch(basicPitch - allowance);
    pitchDiameter.external = { max: pdMax, min: roundInch(pdMax - pdTol) };
    majorDiameter.external = { max: roundInch(D - allowance), min: roundInch(D - allowance - 0.01 * p) };
    minorDiameter.external = { max: roundInch(basicMinor - allowance), min: NaN };
    notes.push("Acme pitch-diameter tolerance provisional (pending full ASME B1.5 table validation).");
  } else {
    pitchDiameter.internal = { max: roundInch(basicPitch + pdTol), min: roundInch(basicPitch) };
    minorDiameter.internal = { max: NaN, min: roundInch(basicMinor) };
    majorDiameter.internal = { max: NaN, min: roundInch(D + 0.01 * p) };
    notes.push("Acme tolerance provisional (pending full ASME B1.5 table validation).");
  }

  let wires: ThreadResult["wires"];
  if (external && pitchDiameter.external) {
    const w = bestWire(p, ACME_ANGLE);
    const e = pitchDiameter.external;
    const majMax = majorDiameter.external?.max ?? D;
    wires = {
      bestWire: roundInch(w),
      minWire: roundInch(0.4872 * p),
      maxWire: roundInch(0.65 * p),
      constantBest: roundInch(wireConstant(w, p, ACME_ANGLE)),
      mow: {
        max: roundInch(measurementOverWires(e.max, w, p, ACME_ANGLE)),
        min: roundInch(measurementOverWires(e.min, w, p, ACME_ANGLE)),
      },
    };
    if (input.alternateWire) {
      wires.alternate = alternateWire(e, input.alternateWire, p, ACME_ANGLE, majMax, roundInch);
    }
  }

  const lead = starts * p;
  const la = leadAngleDeg(lead, basicPitch);

  const startTag = starts > 1 ? `, ${starts}-start` : "";
  const famName = stub ? "Stub Acme" : "Acme";
  return {
    family: input.family,
    designation: `${trim(D)}-${tpi} ${famName}-${cls}${startTag}`,
    units: "inch",
    pitch: p,
    tpi,
    threadAngleDeg: ACME_ANGLE,
    classOfFit: cls,
    starts,
    lead,
    leadAngleDeg: la,
    helixAngleDeg: la,
    fundamentalHeight: fundamentalHeight(p, ACME_ANGLE),
    threadHeight: roundInch(h),
    allowance: external ? allowance : 0,
    majorDiameter,
    pitchDiameter,
    minorDiameter,
    flatAtRoot: { external: roundInch(0.3707 * p), internal: roundInch(0.3707 * p) },
    wires,
    notes,
  };
}

function trim(n: number): string {
  return n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}
