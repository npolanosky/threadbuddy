/**
 * Shared post-processing features used by every thread family:
 * tap-drill recommendations, alternate-wire measurement, and root-flat/radius helpers.
 */

import type { Limits, TapDrillInfo, WireResult } from "../types.js";
import { holeForPercent, nearestDrills } from "../data/drills.js";
import { measurementOverWires, wireConstant } from "./geometry.js";

/** Build a tap-drill recommendation (theoretical hole + nearby standard drills). */
export function buildTapDrillInfo(
  major: number,
  pitch: number,
  units: "inch" | "metric",
  targetPercent = 75,
  tapType: "cut" | "form" = "cut",
): TapDrillInfo {
  const theoretical = holeForPercent(major, pitch, targetPercent, tapType);
  return {
    tapType,
    targetPercent,
    theoretical,
    candidates: nearestDrills(theoretical, major, pitch, tapType, units, 12),
  };
}

/** Recompute measurement-over-wires for a user-supplied alternate wire. */
export function alternateWire(
  extPitch: Limits,
  wire: number,
  pitch: number,
  includedAngleDeg: number,
  majorMax: number,
  roundFn: (v: number) => number,
): NonNullable<WireResult["alternate"]> {
  const mowMax = measurementOverWires(extPitch.max, wire, pitch, includedAngleDeg);
  const mowMin = measurementOverWires(extPitch.min, wire, pitch, includedAngleDeg);
  return {
    wire: roundFn(wire),
    constant: roundFn(wireConstant(wire, pitch, includedAngleDeg)),
    mow: { max: roundFn(mowMax), min: roundFn(mowMin) },
    belowMajor: mowMax < majorMax,
  };
}
