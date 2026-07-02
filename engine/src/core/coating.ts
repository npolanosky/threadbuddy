/**
 * Coating / plating buildup and polishing removal calculations.
 *
 * For a symmetric 60-degree thread, a uniform radial layer of thickness t on each flank changes
 * the pitch diameter by 4*t (the classic "four times the plating thickness" rule) and the major/
 * minor (crest/root) diameters by 2*t. Coating adds material (external diameters grow, internal
 * shrink); polishing removes it (the reverse). This lets a shop compute the pre-plate ("before")
 * dimensions needed so the finished ("after") thread lands within its tolerance.
 */

import type { CoatingInput, CoatingResult, Limits } from "../types.js";

const PD_FACTOR = 4; // pitch-diameter change per unit radial thickness (60-degree thread)
const CREST_FACTOR = 2; // major/minor change per unit radial thickness

export function calculateCoating(input: CoatingInput): CoatingResult {
  const { result, hand, thickness, mode } = input;
  const tol = Math.max(0, input.tolerance ?? 0);
  const notes: string[] = [];
  // External thread grows when coated; internal thread effectively shrinks (less clearance).
  const sign = (mode === "coating" ? 1 : -1) * (hand === "external" ? 1 : -1);
  const pdDelta = sign * PD_FACTOR * thickness;
  const majDelta = sign * CREST_FACTOR * thickness;

  const major = hand === "external" ? result.majorDiameter.external : result.majorDiameter.internal;
  const pitch = hand === "external" ? result.pitchDiameter.external : result.pitchDiameter.internal;
  const minor = hand === "external" ? result.minorDiameter.external : result.minorDiameter.internal;

  if (!major || !pitch || !Number.isFinite(major.max) || !Number.isFinite(pitch.max)) {
    notes.push("Coating requires computed limits for the selected hand.");
    const zero: Limits = { max: NaN, min: NaN };
    return {
      pitchDiameterDelta: pdDelta,
      majorDiameterDelta: majDelta,
      before: { major: zero, pitch: zero, minor: zero },
      after: { major: zero, pitch: zero, minor: zero },
      notes,
    };
  }

  // Minor (root) diameter changes by the same 2*t as the crest; fall back to NaN limits when the
  // engine only reports one bound for this hand.
  const minorLimits: Limits = minor ?? { max: NaN, min: NaN };

  // "after" = the finished thread = the nominal computed limits.
  const after = { major, pitch, minor: minorLimits };
  // "before" (pre-process) window must guarantee the finished part is in tolerance for ANY
  // actual thickness within [t-tol, t+tol]. With delta(t) = sign*F*t evaluated at the band ends:
  //   before.max = after.max - max(deltaLow, deltaHigh)
  //   before.min = after.min - min(deltaLow, deltaHigh)
  const before = {
    major: beforeWindow(major, sign, CREST_FACTOR, thickness, tol),
    pitch: beforeWindow(pitch, sign, PD_FACTOR, thickness, tol),
    minor: beforeWindow(minorLimits, sign, CREST_FACTOR, thickness, tol),
  };

  if (tol > 0 && before.pitch.max < before.pitch.min) {
    notes.push(
      "Thickness tolerance exceeds the available thread tolerance — no pre-process window " +
        "guarantees an in-spec finished thread. Tighten the coating tolerance.",
    );
  }
  notes.push(
    `${mode === "coating" ? "Coating" : "Polishing"} ${hand} thread: pitch diameter ` +
      `${pdDelta >= 0 ? "+" : ""}${pdDelta.toFixed(5)}, major ${majDelta >= 0 ? "+" : ""}` +
      `${majDelta.toFixed(5)} per ${thickness}${tol ? ` ±${tol}` : ""} radial.`,
  );

  return { pitchDiameterDelta: pdDelta, majorDiameterDelta: majDelta, before, after, notes };
}

/** Pre-process limit window accounting for a +/- thickness band (see formula above). */
function beforeWindow(after: Limits, sign: number, factor: number, t: number, tol: number): Limits {
  const deltaLow = sign * factor * (t - tol);
  const deltaHigh = sign * factor * (t + tol);
  return {
    max: after.max - Math.max(deltaLow, deltaHigh),
    min: after.min - Math.min(deltaLow, deltaHigh),
  };
}
