/**
 * Generic symmetric-thread builder for families whose basic geometry is a single well-defined
 * profile: Whitworth (BS 84, 55°), ISO Metric Trapezoidal (ISO 2901, 30°), US Buttress
 * (ASME B1.9, 7°/45°) and ISO Metric Buttress (DIN 513, 3°/30°).
 *
 * Basic diameters are computed from each standard's profile coefficients. Tolerance limits are a
 * provisional symmetric model (flagged in notes) pending per-standard tolerance tables — basic
 * dimensions, lead/helix angle and (for symmetric forms) 3-wire measurement are authoritative.
 *
 * Whitworth basic profile:   d2 = D − 0.640327 p,   d1 = D − 1.280654 p
 * Trapezoidal (ISO 2901):    d2 = D − 0.5 P,        d1 = D − P
 */

import type { ThreadFamily, ThreadInput, ThreadResult } from "../types.js";
import { roundTo } from "./round.js";
import { fundamentalHeight, leadAngleDeg, bestWire, measurementOverWires, wireConstant } from "./geometry.js";
import { alternateWire } from "./features.js";

interface GenericConfig {
  /** Included thread angle (for symmetric forms); 0 disables wire measurement (asymmetric). */
  angle: number;
  units: "inch" | "metric";
  /** pitch diameter = D − pdCoeff * p */
  pdCoeff: number;
  /** minor diameter = D − minorCoeff * p */
  minorCoeff: number;
  /** thread height = depthCoeff * p */
  depthCoeff: number;
  name: string;
  /** wires available (symmetric forms only) */
  wires: boolean;
}

const CONFIG: Partial<Record<ThreadFamily, GenericConfig>> = {
  WHITWORTH: { angle: 55, units: "inch", pdCoeff: 0.640327, minorCoeff: 1.280654, depthCoeff: 0.640327, name: "Whitworth", wires: true },
  TRAPEZOIDAL: { angle: 30, units: "metric", pdCoeff: 0.5, minorCoeff: 1.0, depthCoeff: 0.5, name: "Trapezoidal", wires: true },
  BUTTRESS: { angle: 0, units: "inch", pdCoeff: 0.66271, minorCoeff: 1.32542, depthCoeff: 0.66271, name: "Buttress 7°/45°", wires: false },
  ISO_BUTTRESS: { angle: 0, units: "metric", pdCoeff: 0.86777, minorCoeff: 1.5, depthCoeff: 0.75, name: "ISO Buttress 3°/30°", wires: false },
};

export function deriveGeneric(input: ThreadInput): ThreadResult {
  const cfg = CONFIG[input.family];
  if (!cfg) throw new Error(`No generic config for ${input.family}`);
  const round = (v: number): number => roundTo(v, cfg.units === "metric" ? 4 : 4);
  const D = input.majorDiameter;
  const isMetric = cfg.units === "metric";
  const tpi = input.tpi ?? (input.pitch ? (isMetric ? 25.4 / input.pitch : 1 / input.pitch) : 0);
  const p = input.pitch ?? (isMetric ? 25.4 / tpi : 1 / tpi);
  const starts = input.starts ?? 1;
  const notes: string[] = [
    `${cfg.name}: basic geometry from standard; tolerance limits provisional (not yet from the governing table).`,
  ];

  const H = fundamentalHeight(p, cfg.angle || 60);
  const basicPitch = D - cfg.pdCoeff * p;
  const basicMinor = D - cfg.minorCoeff * p;

  // Provisional symmetric tolerance: small class-scaled pitch-diameter tolerance, zero allowance.
  const pdTol = round((isMetric ? 0.04 * Math.sqrt(p) : 0.05 * Math.sqrt(p)));

  const majorDiameter: ThreadResult["majorDiameter"] = {
    basic: round(D),
    external: { max: round(D), min: round(D - pdTol) },
    internal: { max: NaN, min: round(D) },
  };
  const pitchDiameter: ThreadResult["pitchDiameter"] = {
    basic: round(basicPitch),
    external: { max: round(basicPitch), min: round(basicPitch - pdTol) },
    internal: { max: round(basicPitch + pdTol), min: round(basicPitch) },
  };
  const minorDiameter: ThreadResult["minorDiameter"] = {
    basic: round(basicMinor),
    external: { max: round(basicMinor), min: NaN },
    internal: { max: NaN, min: round(basicMinor) },
  };

  let wires: ThreadResult["wires"];
  if (cfg.wires && pitchDiameter.external) {
    const w = bestWire(p, cfg.angle);
    const e = pitchDiameter.external;
    wires = {
      bestWire: round(w),
      minWire: round(0.5 * p),
      maxWire: round(0.9 * p),
      constantBest: round(wireConstant(w, p, cfg.angle)),
      mow: { max: round(measurementOverWires(e.max, w, p, cfg.angle)), min: round(measurementOverWires(e.min, w, p, cfg.angle)) },
    };
    if (input.alternateWire) {
      wires.alternate = alternateWire(e, input.alternateWire, p, cfg.angle, majorDiameter.external!.max, round);
    }
  }

  const lead = starts * p;
  const la = leadAngleDeg(lead, basicPitch);
  const startTag = starts > 1 ? `, ${starts}-start` : "";
  const desig = isMetric
    ? `${cfg.name} ${D}×${p}${startTag}`
    : `${D.toFixed(4)}-${tpi} ${cfg.name}${startTag}`;

  return {
    family: input.family,
    designation: desig,
    units: cfg.units,
    pitch: p,
    tpi,
    threadAngleDeg: cfg.angle,
    classOfFit: input.classOfFit,
    starts,
    lead,
    leadAngleDeg: la,
    helixAngleDeg: la,
    fundamentalHeight: H,
    threadHeight: round(cfg.depthCoeff * p),
    allowance: 0,
    majorDiameter,
    pitchDiameter,
    minorDiameter,
    flatAtRoot: cfg.angle ? { external: round(p / 6), internal: round(p / 6) } : undefined,
    wires,
    notes,
  };
}

export const GENERIC_FAMILIES = Object.keys(CONFIG) as ThreadFamily[];
