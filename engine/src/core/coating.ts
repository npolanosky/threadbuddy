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

function shift(l: Limits, delta: number): Limits {
  return { max: l.max + delta, min: l.min + delta };
}

export function calculateCoating(input: CoatingInput): CoatingResult {
  const { result, hand, thickness, mode } = input;
  const notes: string[] = [];
  // External thread grows when coated; internal thread effectively shrinks (less clearance).
  const sign = (mode === "coating" ? 1 : -1) * (hand === "external" ? 1 : -1);
  const pdDelta = sign * PD_FACTOR * thickness;
  const majDelta = sign * CREST_FACTOR * thickness;

  const major = hand === "external" ? result.majorDiameter.external : result.majorDiameter.internal;
  const pitch = hand === "external" ? result.pitchDiameter.external : result.pitchDiameter.internal;

  if (!major || !pitch) {
    notes.push("Coating requires computed limits for the selected hand.");
    const zero: Limits = { max: NaN, min: NaN };
    return {
      pitchDiameterDelta: pdDelta,
      majorDiameterDelta: majDelta,
      before: { major: zero, pitch: zero },
      after: { major: zero, pitch: zero },
      notes,
    };
  }

  // "after" = the finished thread = the nominal computed limits.
  // "before" = remove the buildup (for coating) / add back removed stock (for polishing).
  const after = { major, pitch };
  const before = { major: shift(major, -majDelta), pitch: shift(pitch, -pdDelta) };

  notes.push(
    `${mode === "coating" ? "Coating" : "Polishing"} ${hand} thread: pitch diameter ` +
      `${pdDelta >= 0 ? "+" : ""}${pdDelta.toFixed(5)}, major ${majDelta >= 0 ? "+" : ""}` +
      `${majDelta.toFixed(5)} (per ${thickness} radial).`,
  );

  return { pitchDiameterDelta: pdDelta, majorDiameterDelta: majDelta, before, after, notes };
}
