/**
 * Shared thread geometry: angles, fundamental triangle, and three-wire measurement.
 * These helpers are unit-agnostic (work in inches or millimetres consistently).
 */

export const DEG = 180 / Math.PI;

/** Height of the sharp-V fundamental triangle for a given included thread angle. */
export function fundamentalHeight(pitch: number, includedAngleDeg = 60): number {
  // H = p / (2 * tan(angle/2))
  const halfAngle = (includedAngleDeg / 2) / DEG;
  return pitch / (2 * Math.tan(halfAngle));
}

/**
 * Lead (helix) angle at a given diameter, in degrees.
 * tan(lambda) = lead / (pi * diameter), where lead = starts * pitch.
 * ME ThreadPal uses "lead angle" and "helix angle" as interchangeable names for this
 * same angle (measured from the plane perpendicular to the thread axis).
 */
export function leadAngleDeg(lead: number, pitchDiameter: number): number {
  return Math.atan(lead / (Math.PI * pitchDiameter)) * DEG;
}

/** Best (pitch-line-tangent) wire diameter for a symmetric thread of given included angle. */
export function bestWire(pitch: number, includedAngleDeg = 60): number {
  // w_best = p / (2 * cos(angle/2))
  const halfAngle = (includedAngleDeg / 2) / DEG;
  return pitch / (2 * Math.cos(halfAngle));
}

/**
 * Three-wire measurement over wires for a symmetric thread.
 * M = E + w*(1 + 1/sin(angle/2)) - (p/2)*cot(angle/2)
 * (lead-angle/rake correction omitted; negligible for typical single-start threads and
 *  consistent with the way ME ThreadPal reports MOW.)
 */
export function measurementOverWires(
  pitchDiameter: number,
  wire: number,
  pitch: number,
  includedAngleDeg = 60,
): number {
  const halfAngle = (includedAngleDeg / 2) / DEG;
  const term = 1 + 1 / Math.sin(halfAngle);
  const sub = (pitch / 2) / Math.tan(halfAngle);
  return pitchDiameter + wire * term - sub;
}

/** The wire measurement constant C such that MOW = E + C for a given wire. */
export function wireConstant(wire: number, pitch: number, includedAngleDeg = 60): number {
  const halfAngle = (includedAngleDeg / 2) / DEG;
  const term = 1 + 1 / Math.sin(halfAngle);
  const sub = (pitch / 2) / Math.tan(halfAngle);
  return wire * term - sub;
}

/**
 * Practical min/max wire sizes for 60-degree threads (Machinery's Handbook limits).
 * Outside this range a wire rests on the crest or bottoms in the root.
 */
export const WIRE_MAX_FACTOR_60 = 0.90021;
export const WIRE_MIN_FACTOR_60 = 0.56009;
export const WIRE_BEST_FACTOR_60 = 0.57735;
