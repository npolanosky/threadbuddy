/**
 * Unified inch screw threads — ASME B1.1-2003.
 * Covers UN/UNC/UNF/UNEF/UNS (flat root), UNR (rounded external root) and the basis for
 * UNJ (controlled root radius, see unj.ts).
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

// Basic-profile coefficients (× pitch) for 60° Unified threads.
const PD_COEFF = 0.6495190528; // 0.75 * H/p ; pitch dia  = D - PD_COEFF * p
const MINOR_INT_COEFF = 1.0825317547; // 1.25 * H/p ; internal minor basic = D - this * p
const MINOR_EXT_COEFF = 1.299038106; // 1.50 * H/p ; external minor (flat root) = D - this * p

/** External pitch-diameter tolerance for Class 2A (the reference class). */
function pdTol2A(d: number, p: number, le: number): number {
  return 0.0015 * cbrt(d) + 0.0015 * Math.sqrt(le) + 0.015 * cbrt(p * p);
}

/** Class multipliers for external pitch-diameter tolerance relative to 2A. */
const EXT_PD_CLASS_FACTOR: Record<string, number> = { "1A": 1.5, "2A": 1.0, "3A": 0.75 };
/** Internal PD tolerance = 1.300 × the external tolerance of the same numeric class. */
const INT_PD_CLASS_FACTOR: Record<string, number> = { "1B": 1.95, "2B": 1.3, "3B": 0.975 };

function isExternalClass(c: string): boolean {
  return c.toUpperCase().endsWith("A");
}

export function deriveUN(input: ThreadInput): ThreadResult {
  const notes: string[] = [];
  const D = input.majorDiameter;
  const tpi = input.tpi ?? (input.pitch ? 1 / input.pitch : 0);
  const p = input.pitch ?? 1 / tpi;
  const cls = input.classOfFit.toUpperCase();
  const external = isExternalClass(cls);
  const le = input.lengthOfEngagement ?? D; // B1.1 table basis: LE = basic major diameter
  const starts = input.starts ?? 1;
  const rounded = input.family === "UNR" || input.family === "UNJ";

  const H = fundamentalHeight(p, 60);

  // Basic diameters.
  const basicPitch = D - PD_COEFF * p;
  const basicMinorInternal = D - MINOR_INT_COEFF * p;
  const basicMinorExternal = D - MINOR_EXT_COEFF * p;

  // External tolerances / allowance derived from the 2A reference tolerance.
  const tol2A = pdTol2A(D, p, le);
  const allowance = roundInch(0.3 * tol2A); // applies to classes 1A & 2A; zero for 3A
  const es = cls === "3A" ? 0 : allowance;

  // External major-diameter tolerance.
  const majorTolExt = roundInch((cls === "1A" ? 0.09 : 0.06) * cbrt(p * p));

  const majorDiameter: ThreadResult["majorDiameter"] = { basic: D };
  const pitchDiameter: ThreadResult["pitchDiameter"] = { basic: roundInch(basicPitch) };
  const minorDiameter: ThreadResult["minorDiameter"] = {
    basic: roundInch(rounded ? basicMinorInternal : basicMinorExternal),
  };

  if (external) {
    const pdTol = roundInch(tol2A * (EXT_PD_CLASS_FACTOR[cls] ?? 1));
    const pdMax = roundInch(basicPitch - es);
    const pdMin = roundInch(pdMax - pdTol);
    const majMax = roundInch(D - es);
    const majMin = roundInch(majMax - majorTolExt);

    pitchDiameter.external = { max: pdMax, min: pdMin } as Limits;
    majorDiameter.external = { max: majMax, min: majMin } as Limits;
    // External minor diameter is a reference feature in B1.1 (controlled by form/gaging).
    // Max external minor follows the max-material pitch diameter and the basic form.
    const extMinorMax = roundInch(pdMax - 2 * (0.375 * H)); // = pdMax - 0.75H (root side)
    minorDiameter.external = { max: extMinorMax, min: roundInch(extMinorMax - pdTol) } as Limits;
  } else {
    // Internal thread: zero allowance (min at basic).
    const pdTol = roundInch(tol2A * (INT_PD_CLASS_FACTOR[cls] ?? 1.3));
    const pdMin = roundInch(basicPitch);
    const pdMax = roundInch(pdMin + pdTol);
    pitchDiameter.internal = { max: pdMax, min: pdMin } as Limits;

    // Internal minor diameter: min = basic minor (max material / tap-drill basis).
    const minorMin = roundInch(basicMinorInternal);
    const minorTol = internalMinorTolerance(p, cls);
    minorDiameter.internal = { max: roundInch(minorMin + minorTol), min: minorMin } as Limits;
    if (minorTol === 0) notes.push("Internal minor diameter tolerance provisional.");

    // Internal major diameter: min = basic major D; no max specified (reference).
    majorDiameter.internal = { max: NaN, min: roundInch(D) } as Limits;
  }

  // Measurement over wires (external threads).
  let wires: ThreadResult["wires"];
  if (external && pitchDiameter.external) {
    const w = bestWire(p, 60);
    const e = pitchDiameter.external; // use external pitch-dia limits for MOW limits
    wires = {
      bestWire: roundInch(w),
      minWire: roundInch(WIRE_MIN_FACTOR_60 * p),
      maxWire: roundInch(WIRE_MAX_FACTOR_60 * p),
      constantBest: roundInch(wireConstant(w, p, 60)),
      mow: {
        max: roundInch(measurementOverWires(e.max, w, p, 60)),
        min: roundInch(measurementOverWires(e.min, w, p, 60)),
      },
    };
  }

  // Lead / helix angle at the basic pitch diameter.
  const lead = starts * p;
  const la = leadAngleDeg(lead, basicPitch);

  // Tap drill for internal threads (target percent thread, default 75%).
  const tapDrill = roundInch(D - 0.75 * MINOR_EXT_COEFF * p);

  return {
    family: input.family,
    designation: unDesignation(D, tpi, input.family, cls, notes),
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
    threadHeight: roundInch(0.625 * H), // external thread height of engagement (5/8 H)
    allowance: external ? es : 0,
    majorDiameter,
    pitchDiameter,
    minorDiameter,
    wires,
    tapDrill: external ? undefined : tapDrill,
    notes,
  };
}

/**
 * Internal minor-diameter tolerance per ASME B1.1.
 * NOTE: B1.1 specifies these via a piecewise-by-pitch rule; the full rule is implemented in
 * a follow-up. Returns 0 (flagged) until the cited rule is encoded, so primary dimensions
 * (pitch/major/allowance) remain authoritative and the gap is surfaced, never hidden.
 */
function internalMinorTolerance(_p: number, _cls: string): number {
  return 0;
}

function unDesignation(
  D: number,
  tpi: number,
  family: string,
  cls: string,
  _notes: string[],
): string {
  const dia = D.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  const fam = family === "UN" ? "UN" : family;
  return `${dia}-${tpi}${fam}-${cls}`;
}
