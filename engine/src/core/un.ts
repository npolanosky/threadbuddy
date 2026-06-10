/**
 * Unified inch screw threads — ASME B1.1-2003.
 * Covers UN/UNC/UNF/UNEF/UNS (flat root), UNR (rounded external root) and the basis for UNJ.
 *
 * Verified against the published 1/2-13 UNC table row:
 *   2A pitch dia 0.4485 / 0.4435, allowance 0.0015, major 0.4985 / 0.4876
 *   2B pitch dia 0.4565 / 0.4500, internal minor min 0.4167
 * using length of engagement = basic major diameter D and ASME B1.30 4-decimal rounding.
 */

import type { ThreadInput, ThreadResult, Limits } from "../types.js";
import { roundInch, cbrt } from "./round.js";
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

const PD_COEFF = 0.6495190528; // pitch dia  = D - 0.649519 p
const MINOR_INT_COEFF = 1.0825317547; // internal minor basic = D - 1.082532 p
const MINOR_EXT_COEFF = 1.299038106; // external minor (flat root) = D - 1.299038 p
const MINOR_EXT_SHARP = 1.7320508076; // external minor (sharp root) = D - 2H = D - 1.732051 p

function pdTol2A(d: number, p: number, le: number): number {
  return 0.0015 * cbrt(d) + 0.0015 * Math.sqrt(le) + 0.015 * cbrt(p * p);
}

const EXT_PD_CLASS_FACTOR: Record<string, number> = { "1A": 1.5, "2A": 1.0, "3A": 0.75 };
const INT_PD_CLASS_FACTOR: Record<string, number> = { "1B": 1.95, "2B": 1.3, "3B": 0.975 };

const isExternalClass = (c: string): boolean => c.toUpperCase().endsWith("A");

export function deriveUN(input: ThreadInput): ThreadResult {
  const notes: string[] = [];
  const D = input.majorDiameter;
  const tpi = input.tpi ?? (input.pitch ? 1 / input.pitch : 0);
  const p = input.pitch ?? 1 / tpi;
  const cls = input.classOfFit.toUpperCase();
  const external = isExternalClass(cls);
  const le = input.lengthOfEngagement ?? D;
  const starts = input.starts ?? 1;
  const isUNJ = input.family === "UNJ";
  const isUNR = input.family === "UNR";
  const sharp = input.sharpRoot ?? false;

  const H = fundamentalHeight(p, 60);

  const basicPitch = D - PD_COEFF * p;
  // UNJ (SAE AS8879 / ASME B1.15): increased minor diameters (basic height 0.5625H) to clear the
  // controlled external root radius. UN/UNR use the standard minors.
  const basicMinorInternal = isUNJ ? D - 0.97428 * p : D - MINOR_INT_COEFF * p;
  const basicMinorExternal = isUNJ
    ? D - 1.19078 * p
    : D - (sharp ? MINOR_EXT_SHARP : MINOR_EXT_COEFF) * p;

  const tol2A = pdTol2A(D, p, le);
  const allowance = roundInch(0.3 * tol2A);
  const es = cls === "3A" ? 0 : allowance;
  const majorTolExt = roundInch((cls === "1A" ? 0.09 : 0.06) * cbrt(p * p));

  const majorDiameter: ThreadResult["majorDiameter"] = { basic: D };
  const pitchDiameter: ThreadResult["pitchDiameter"] = { basic: roundInch(basicPitch) };
  const minorDiameter: ThreadResult["minorDiameter"] = {
    basic: roundInch(external ? basicMinorExternal : basicMinorInternal),
  };

  // Root flat / radius. UN: optional rounded root, max radius 0.144P. UNR: mandatory rounded root
  // 0.108–0.144P (external only). UNJ: controlled root radius 0.15011–0.18042P. Sharp removes the flat.
  const flatAtRoot = {
    external: sharp || isUNJ ? 0 : roundInch(p / 4),
    internal: sharp ? 0 : roundInch(p / 8),
  };
  const rootRadius: Limits = isUNJ
    ? { max: roundInch(0.18042 * p), min: roundInch(0.15011 * p) }
    : { max: roundInch(0.144 * p), min: isUNR ? roundInch(0.108 * p) : NaN };
  if (isUNJ) notes.push("UNJ profile (AS8879/B1.15): controlled external root radius 0.15011–0.18042P; minor diameters increased (basic height 0.5625H).");
  if (isUNR) notes.push("UNR: mandatory rounded external root (radius 0.108–0.144P); other dimensions match UN.");

  let wires: ThreadResult["wires"];

  if (external) {
    const pdTol = roundInch(tol2A * (EXT_PD_CLASS_FACTOR[cls] ?? 1));
    const pdMax = roundInch(basicPitch - es);
    const pdMin = roundInch(pdMax - pdTol);
    const majMax = roundInch(D - es);
    const majMin = roundInch(majMax - majorTolExt);
    pitchDiameter.external = { max: pdMax, min: pdMin } as Limits;
    majorDiameter.external = { max: majMax, min: majMin } as Limits;
    const extMinorMax = roundInch(basicMinorExternal - es);
    minorDiameter.external = { max: extMinorMax, min: roundInch(extMinorMax - pdTol) } as Limits;

    const w = bestWire(p, 60);
    wires = {
      bestWire: roundInch(w),
      minWire: roundInch(WIRE_MIN_FACTOR_60 * p),
      maxWire: roundInch(WIRE_MAX_FACTOR_60 * p),
      constantBest: roundInch(wireConstant(w, p, 60)),
      mow: {
        max: roundInch(measurementOverWires(pdMax, w, p, 60)),
        min: roundInch(measurementOverWires(pdMin, w, p, 60)),
      },
    };
    if (input.alternateWire) {
      wires.alternate = alternateWire(pitchDiameter.external, input.alternateWire, p, 60, majMax, roundInch);
    }
  } else {
    const pdTol = roundInch(tol2A * (INT_PD_CLASS_FACTOR[cls] ?? 1.3));
    const pdMin = roundInch(basicPitch);
    pitchDiameter.internal = { max: roundInch(pdMin + pdTol), min: pdMin } as Limits;
    const minorMin = roundInch(basicMinorInternal);
    minorDiameter.internal = { max: NaN, min: minorMin } as Limits;
    notes.push("Internal minor diameter max tolerance per ASME B1.1 — provisional.");
    majorDiameter.internal = { max: NaN, min: roundInch(D) } as Limits;
  }

  const lead = starts * p;
  const la = leadAngleDeg(lead, basicPitch);

  // Tap-drill recommendation (internal threads).
  const tapType = input.tapType ?? "cut";
  const targetPercent = input.targetPercent ?? 75;
  const tapDrillInfo = !external ? buildTapDrillInfo(D, p, "inch", targetPercent, tapType) : undefined;

  return {
    family: input.family,
    designation: unDesignation(D, tpi, input.family, cls),
    units: "inch",
    pitch: p,
    tpi,
    threadAngleDeg: 60,
    classOfFit: cls,
    starts,
    lead,
    leadAngleDeg: la,
    helixAngleDeg: la,
    fundamentalHeight: H,
    threadHeight: roundInch((isUNJ ? 0.5625 : 0.625) * H),
    allowance: external ? es : 0,
    majorDiameter,
    pitchDiameter,
    minorDiameter,
    flatAtRoot,
    rootRadius,
    wires,
    tapDrill: tapDrillInfo ? roundInch(tapDrillInfo.theoretical) : undefined,
    tapDrillInfo,
    notes,
  };
}

function unDesignation(D: number, tpi: number, family: string, cls: string): string {
  const dia = D.toFixed(4);
  return `${dia}-${tpi}${family}-${cls}`;
}
