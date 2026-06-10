/**
 * Core type definitions for the ThreadBuddy calculation engine.
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
  /** Sharp (un-truncated) root: removes the flat at root, deepening the minor diameter. */
  sharpRoot?: boolean;
  /** Target percent of thread for tap-drill selection (default 75). */
  targetPercent?: number;
  /** Tap style for tap-drill selection. */
  tapType?: "cut" | "form";
  /** User-supplied alternate measuring-wire diameter (native units). */
  alternateWire?: number;
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
  /** Results for a user-supplied alternate wire diameter, if provided. */
  alternate?: {
    wire: number;
    constant: number;
    mow: Limits;
    /** True if the alternate MOW falls below the major diameter (warning condition). */
    belowMajor: boolean;
  };
}

/** A candidate drill for a tap-drill table. */
export interface DrillCandidate {
  /** Display name, e.g. "27/64", "#7", "Q", "8.5 mm". */
  name: string;
  /** Decimal diameter in inches. */
  inch: number;
  /** Diameter in millimetres. */
  mm: number;
  /** Resulting percent of thread when used for this internal thread. */
  percent: number;
}

/** Tap-drill recommendation for an internal thread. */
export interface TapDrillInfo {
  tapType: "cut" | "form";
  targetPercent: number;
  /** Theoretical hole diameter (native units) for the target percent. */
  theoretical: number;
  /** Nearest standard drills around the theoretical hole, with resulting percent. */
  candidates: DrillCandidate[];
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
  /** Flat width at the thread root (native units), if the form defines one. */
  flatAtRoot?: { external?: number; internal?: number };
  /** Root radius limits (native units) for rounded-root forms. */
  rootRadius?: Limits;
  wires?: WireResult;
  /** Recommended tap drill diameter for the internal thread, if applicable. */
  tapDrill?: number;
  /** Detailed tap-drill recommendation with a table of candidate drills. */
  tapDrillInfo?: TapDrillInfo;
  /** Tapered-pipe-specific results (NPT/NPTF/BSPT), present only for taper families. */
  taper?: TaperResult;
  /** Non-fatal notes (e.g. "special size", validation hints). */
  notes: string[];
}

/** A dimension reported at the two reference planes of a taper thread. */
export interface PlanePair {
  pipeFace: number;
  gageNotch: number;
}

/** Tapered pipe thread results per ASME B1.20.1 / ISO 7-1. */
export interface TaperResult {
  pipeDiameter: number;
  external: { major: PlanePair; pitch: PlanePair; minor: PlanePair };
  internal: {
    minor: { pipeEndL1: number; pipeFace: number };
    pitchGageNotch: number;
    tapDrill: number;
    tapDrillName: string;
    tapDepthRef: number;
  };
  flat: { crest: Limits; root: Limits };
  truncation: { crest: Limits; root: Limits };
  radii?: { crest: Limits; root: Limits };
  /** Engagement lengths: L1 hand-tight, L2 effective, L3 wrench makeup, L4 overall. */
  lengths: { L1: number; L2: number; L3: number; L4: number };
  heightMean: number;
  /** Measurement over wires at the gauge notch (informational). */
  mowGageNotch?: number;
}

// ---- Coating / polishing ----

export interface CoatingInput {
  result: ThreadResult;
  hand: ThreadHand;
  /** Radial coating thickness per surface (native units). Positive adds material. */
  thickness: number;
  /** +/- tolerance band on the radial thickness (native units). Default 0. */
  tolerance?: number;
  /** "coating" adds material; "polishing" removes it. */
  mode: "coating" | "polishing";
}

export interface CoatingResult {
  /** Pitch-diameter change applied (4x thickness for 60-degree threads). */
  pitchDiameterDelta: number;
  /** Major-diameter change applied (2x thickness). */
  majorDiameterDelta: number;
  before: { major: Limits; pitch: Limits };
  after: { major: Limits; pitch: Limits };
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
