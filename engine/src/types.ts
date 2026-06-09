/**
 * Core type definitions for the Threadpal-Web calculation engine.
 *
 * All linear dimensions inside the engine are carried in the thread's NATIVE unit
 * (inches for inch-series threads, millimetres for metric threads). Unit conversion
 * for display happens at the presentation layer, never inside the formulas — this keeps
 * every formula identical to its governing standard and avoids rounding drift.
 */

export type Units = "inch" | "metric";

/** A min/max limit pair for a single feature (e.g. external pitch diameter). */
export interface Limits {
  max: number;
  min: number;
}

/** Families of thread the engine can calculate. */
export type ThreadFamily =
  | "UN" // Unified inch, flat root (UN/UNC/UNF/UNEF/UNS) — ASME B1.1
  | "UNR" // Unified inch, rounded external root — ASME B1.1
  | "UNJ" // Unified inch, controlled root radius, increased minor — SAE AS8879
  | "UNM" // Unified miniature — ASME B1.10
  | "M" // ISO metric M profile — ASME B1.13M / ISO 965
  | "MJ" // ISO metric MJ profile — ASME B1.21M / ISO 5855
  | "ACME" // General-purpose / centralizing Acme — ASME B1.5
  | "STUB_ACME" // Stub Acme — ASME B1.5
  | "TRAPEZOIDAL" // ISO metric trapezoidal — ISO 2901
  | "BUTTRESS" // US buttress 7x45 — ASME B1.9
  | "ISO_BUTTRESS" // ISO metric buttress 3x30 — DIN 513
  | "WHITWORTH" // BSW / BSF / Whitworth special — BS 84
  | "NPT" // American taper pipe — ASME B1.20.1
  | "NPTF" // Dryseal taper pipe — ASME B1.20.1 / B1.20.3
  | "NPSM" // American straight pipe, mechanical — ASME B1.20.1
  | "NPSL" // American straight pipe, locknut — ASME B1.20.1
  | "BSPT" // ISO taper pipe — ISO 7-1
  | "BSPP" // ISO parallel pipe — ISO 7-1
  | "STI_UN" // Screw thread insert, Unified
  | "STI_M" // Screw thread insert, metric
  | "PG_CONDUIT"; // Metric conduit — DIN 40430

export type ThreadHand = "external" | "internal";

/**
 * Normalised input for a single calculation.
 * `majorDiameter` and `pitch` are always in the native unit of the family.
 * For inch series provide either `pitch` or `tpi` (threads per inch); the engine
 * derives the other.
 */
export interface ThreadInput {
  family: ThreadFamily;
  majorDiameter: number;
  pitch?: number;
  tpi?: number;
  /** e.g. "2A","3B" for Unified; "6g","6H" for metric. */
  classOfFit: string;
  /** Length of engagement in native units. Defaults per family (UN: basic major D). */
  lengthOfEngagement?: number;
  /** Number of thread starts for multi-start lead/helix calculations. Default 1. */
  starts?: number;
}

/** Result of a single feature's basic + limit dimensions. */
export interface FeatureDimensions {
  basic: number;
  external?: Limits;
  internal?: Limits;
}

/** Measurement-over-wires results for external threads. */
export interface WireResult {
  bestWire: number;
  minWire: number;
  maxWire: number;
  /** Measurement-over-wires limits using the best wire. */
  mow: Limits;
  /** Single-wire measurement constant C, where MOW = E + C (C depends on wire size). */
  constantBest: number;
}

/** Full calculation result for a thread. */
export interface ThreadResult {
  family: ThreadFamily;
  designation: string;
  units: Units;
  pitch: number;
  tpi: number;
  threadAngleDeg: number;
  classOfFit: string;
  starts: number;
  lead: number;
  /** Lead angle at the pitch diameter, degrees. Helix angle = 90 - lead angle. */
  leadAngleDeg: number;
  helixAngleDeg: number;
  /** Sharp-V triangle height H (native units). */
  fundamentalHeight: number;
  /** Basic thread height (engagement) where defined by the standard. */
  threadHeight: number;
  allowance: number;
  majorDiameter: FeatureDimensions;
  pitchDiameter: FeatureDimensions;
  minorDiameter: FeatureDimensions;
  wires?: WireResult;
  /** Recommended tap drill diameter for the internal thread, if applicable. */
  tapDrill?: number;
  /** Non-fatal notes (e.g. "special size", validation hints). */
  notes: string[];
}

/** A row of authoritative reference data digitized from a published standard. */
export interface ReferenceRow {
  designation: string;
  majorDiameter: number;
  tpi?: number;
  pitch?: number;
  classOfFit: string;
  /** Expected feature values keyed by path, e.g. "pitchDiameter.external.max". */
  expected: Record<string, number>;
  /** Citation: standard + table/clause. */
  source: string;
}
