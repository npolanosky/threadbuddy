/**
 * Standard drill-size database and tap-drill selection.
 *
 * Drill decimal equivalents are exact standard constants (ANSI number/letter drills, fractional
 * inch in 1/64 steps, and a metric set). Percent-of-thread is computed from the geometric relation
 *   percent = 100 * (D - hole) / (k * p)
 * with k = 1.299038 for cut taps (full root truncation) and k = 0.649519 for form (roll) taps
 * (the standard "half the hole reduction" rule of thumb for cold-form taps — approximate).
 */

export interface Drill {
  name: string;
  inch: number;
}

// ANSI number drills #1..#80 (decimal inch).
const NUMBER_DRILLS: Array<[number, number]> = [
  [1, 0.228], [2, 0.221], [3, 0.213], [4, 0.209], [5, 0.2055], [6, 0.204], [7, 0.201],
  [8, 0.199], [9, 0.196], [10, 0.1935], [11, 0.191], [12, 0.189], [13, 0.185], [14, 0.182],
  [15, 0.18], [16, 0.177], [17, 0.173], [18, 0.1695], [19, 0.166], [20, 0.161], [21, 0.159],
  [22, 0.157], [23, 0.154], [24, 0.152], [25, 0.1495], [26, 0.147], [27, 0.144], [28, 0.1405],
  [29, 0.136], [30, 0.1285], [31, 0.12], [32, 0.116], [33, 0.113], [34, 0.111], [35, 0.11],
  [36, 0.1065], [37, 0.104], [38, 0.1015], [39, 0.0995], [40, 0.098], [41, 0.096], [42, 0.0935],
  [43, 0.089], [44, 0.086], [45, 0.082], [46, 0.081], [47, 0.0785], [48, 0.076], [49, 0.073],
  [50, 0.07], [51, 0.067], [52, 0.0635], [53, 0.0595], [54, 0.055], [55, 0.052], [56, 0.0465],
  [57, 0.043], [58, 0.042], [59, 0.041], [60, 0.04], [61, 0.039], [62, 0.038], [63, 0.037],
  [64, 0.036], [65, 0.035], [66, 0.033], [67, 0.032], [68, 0.031], [69, 0.0292], [70, 0.028],
  [71, 0.026], [72, 0.025], [73, 0.024], [74, 0.0225], [75, 0.021], [76, 0.02], [77, 0.018],
  [78, 0.016], [79, 0.0145], [80, 0.0135],
];

// ANSI letter drills A..Z (decimal inch).
const LETTER_DRILLS: Array<[string, number]> = [
  ["A", 0.234], ["B", 0.238], ["C", 0.242], ["D", 0.246], ["E", 0.25], ["F", 0.257],
  ["G", 0.261], ["H", 0.266], ["I", 0.272], ["J", 0.277], ["K", 0.281], ["L", 0.29],
  ["M", 0.295], ["N", 0.302], ["O", 0.316], ["P", 0.323], ["Q", 0.332], ["R", 0.339],
  ["S", 0.348], ["T", 0.358], ["U", 0.368], ["V", 0.377], ["W", 0.386], ["X", 0.397],
  ["Y", 0.404], ["Z", 0.413],
];

const GCD = (a: number, b: number): number => (b === 0 ? a : GCD(b, a % b));
function fractionName(n: number): string {
  // n is the number of 64ths.
  const whole = Math.floor(n / 64);
  const rem = n % 64;
  if (rem === 0) return `${whole}`;
  const g = GCD(rem, 64);
  const num = rem / g;
  const den = 64 / g;
  return whole > 0 ? `${whole} ${num}/${den}` : `${num}/${den}`;
}

function buildDrills(): Drill[] {
  const list: Drill[] = [];
  for (const [n, inch] of NUMBER_DRILLS) list.push({ name: `#${n}`, inch });
  for (const [l, inch] of LETTER_DRILLS) list.push({ name: l, inch });
  // Fractional inch, 1/64 .. 256/64 (4").
  for (let n = 1; n <= 256; n++) list.push({ name: `${fractionName(n)}"`, inch: (n / 64) });
  // Metric drills 0.5 .. 26 mm in 0.1 mm steps.
  for (let mmTenths = 5; mmTenths <= 260; mmTenths++) {
    const mm = mmTenths / 10;
    list.push({ name: `${mm.toFixed(1)} mm`, inch: mm / 25.4 });
  }
  return list.sort((a, b) => a.inch - b.inch);
}

export const DRILLS: Drill[] = buildDrills();

/** Geometric percent of thread for a given internal-thread hole diameter (native units). */
export function percentOfThread(
  major: number,
  pitch: number,
  hole: number,
  tapType: "cut" | "form",
): number {
  const k = tapType === "form" ? 0.649519 : 1.299038;
  return (100 * (major - hole)) / (k * pitch);
}

/** Theoretical hole diameter (native units) for a target percent of thread. */
export function holeForPercent(
  major: number,
  pitch: number,
  percent: number,
  tapType: "cut" | "form",
): number {
  const k = tapType === "form" ? 0.649519 : 1.299038;
  return major - (percent / 100) * k * pitch;
}

/**
 * Find the nearest standard drills around a theoretical hole diameter.
 * Returns up to `span` drills on each side plus the closest, ordered ascending by size, each with
 * the resulting percent of thread. `units` selects which value of each Drill to report as primary.
 */
export function nearestDrills(
  theoretical: number,
  major: number,
  pitch: number,
  tapType: "cut" | "form",
  units: "inch" | "metric",
  span = 3,
): import("../types.js").DrillCandidate[] {
  // theoretical is in native units; DRILLS store inch — convert query to inch.
  const queryInch = units === "metric" ? theoretical / 25.4 : theoretical;
  // Find insertion index.
  let idx = DRILLS.findIndex((d) => d.inch >= queryInch);
  if (idx < 0) idx = DRILLS.length - 1;
  const start = Math.max(0, idx - span);
  const end = Math.min(DRILLS.length, idx + span + 1);
  return DRILLS.slice(start, end).map((d) => {
    const holeNative = units === "metric" ? d.inch * 25.4 : d.inch;
    return {
      name: d.name,
      inch: round4(d.inch),
      mm: round3(d.inch * 25.4),
      percent: Math.round(percentOfThread(major, pitch, holeNative, tapType) * 10) / 10,
    };
  });
}

const round4 = (v: number): number => Math.round(v * 1e4) / 1e4;
const round3 = (v: number): number => Math.round(v * 1e3) / 1e3;
