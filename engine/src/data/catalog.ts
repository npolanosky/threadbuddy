/**
 * Standard built-in thread size catalog.
 *
 * Each entry is a standard diameter/pitch combination from the governing standard. Values are
 * facts from the published series tables (ASME B1.1, ISO 261/262, ASME B1.5, etc.). The catalog
 * is intentionally easy to extend; the core series below cover the great majority of real use.
 *
 * tpi is used for inch families; pitch (mm) for metric families. Number sizes use the screw
 * number (#) with the corresponding decimal major diameter pre-computed: D = 0.060 + 0.013*N.
 */

import type { ThreadFamily } from "../types.js";

export interface CatalogEntry {
  family: ThreadFamily;
  /** Human label shown in the size dropdown, e.g. "1/2-13 UNC" or "M10 x 1.5". */
  label: string;
  majorDiameter: number;
  tpi?: number;
  pitch?: number;
  /** Series tag, e.g. "UNC","UNF","UNEF","coarse","fine","GP". */
  series: string;
}

const numDia = (n: number): number => Math.round((0.06 + 0.013 * n) * 1000) / 1000;

// ---- Unified inch: coarse (UNC) ----
const UNC: Array<[string, number, number]> = [
  ["#1-64", numDia(1), 64], ["#2-56", numDia(2), 56], ["#3-48", numDia(3), 48],
  ["#4-40", numDia(4), 40], ["#5-40", numDia(5), 40], ["#6-32", numDia(6), 32],
  ["#8-32", numDia(8), 32], ["#10-24", numDia(10), 24], ["#12-24", numDia(12), 24],
  ["1/4-20", 0.25, 20], ["5/16-18", 0.3125, 18], ["3/8-16", 0.375, 16],
  ["7/16-14", 0.4375, 14], ["1/2-13", 0.5, 13], ["9/16-12", 0.5625, 12],
  ["5/8-11", 0.625, 11], ["3/4-10", 0.75, 10], ["7/8-9", 0.875, 9],
  ["1-8", 1.0, 8], ["1 1/8-7", 1.125, 7], ["1 1/4-7", 1.25, 7],
  ["1 3/8-6", 1.375, 6], ["1 1/2-6", 1.5, 6], ["1 3/4-5", 1.75, 5],
  ["2-4.5", 2.0, 4.5], ["2 1/4-4.5", 2.25, 4.5], ["2 1/2-4", 2.5, 4],
  ["2 3/4-4", 2.75, 4], ["3-4", 3.0, 4], ["3 1/2-4", 3.5, 4], ["4-4", 4.0, 4],
];

// ---- Unified inch: fine (UNF) ----
const UNF: Array<[string, number, number]> = [
  ["#0-80", numDia(0), 80], ["#1-72", numDia(1), 72], ["#2-64", numDia(2), 64],
  ["#3-56", numDia(3), 56], ["#4-48", numDia(4), 48], ["#5-44", numDia(5), 44],
  ["#6-40", numDia(6), 40], ["#8-36", numDia(8), 36], ["#10-32", numDia(10), 32],
  ["#12-28", numDia(12), 28], ["1/4-28", 0.25, 28], ["5/16-24", 0.3125, 24],
  ["3/8-24", 0.375, 24], ["7/16-20", 0.4375, 20], ["1/2-20", 0.5, 20],
  ["9/16-18", 0.5625, 18], ["5/8-18", 0.625, 18], ["3/4-16", 0.75, 16],
  ["7/8-14", 0.875, 14], ["1-12", 1.0, 12], ["1 1/8-12", 1.125, 12],
  ["1 1/4-12", 1.25, 12], ["1 3/8-12", 1.375, 12], ["1 1/2-12", 1.5, 12],
];

// ---- Unified inch: extra-fine (UNEF) ----
const UNEF: Array<[string, number, number]> = [
  ["#12-32", numDia(12), 32], ["1/4-32", 0.25, 32], ["5/16-32", 0.3125, 32],
  ["3/8-32", 0.375, 32], ["7/16-28", 0.4375, 28], ["1/2-28", 0.5, 28],
  ["9/16-24", 0.5625, 24], ["5/8-24", 0.625, 24], ["11/16-24", 0.6875, 24],
  ["3/4-20", 0.75, 20], ["13/16-20", 0.8125, 20], ["7/8-20", 0.875, 20],
  ["15/16-20", 0.9375, 20], ["1-20", 1.0, 20],
];

// ---- Metric coarse ----
const M_COARSE: Array<[string, number, number]> = [
  ["M1 x 0.25", 1, 0.25], ["M1.2 x 0.25", 1.2, 0.25], ["M1.6 x 0.35", 1.6, 0.35],
  ["M2 x 0.4", 2, 0.4], ["M2.5 x 0.45", 2.5, 0.45], ["M3 x 0.5", 3, 0.5],
  ["M3.5 x 0.6", 3.5, 0.6], ["M4 x 0.7", 4, 0.7], ["M5 x 0.8", 5, 0.8],
  ["M6 x 1", 6, 1], ["M8 x 1.25", 8, 1.25], ["M10 x 1.5", 10, 1.5],
  ["M12 x 1.75", 12, 1.75], ["M14 x 2", 14, 2], ["M16 x 2", 16, 2],
  ["M18 x 2.5", 18, 2.5], ["M20 x 2.5", 20, 2.5], ["M22 x 2.5", 22, 2.5],
  ["M24 x 3", 24, 3], ["M27 x 3", 27, 3], ["M30 x 3.5", 30, 3.5],
  ["M33 x 3.5", 33, 3.5], ["M36 x 4", 36, 4], ["M39 x 4", 39, 4],
  ["M42 x 4.5", 42, 4.5], ["M48 x 5", 48, 5], ["M56 x 5.5", 56, 5.5], ["M64 x 6", 64, 6],
];

// ---- Metric fine ----
const M_FINE: Array<[string, number, number]> = [
  ["M6 x 0.75", 6, 0.75], ["M8 x 1", 8, 1], ["M10 x 1.25", 10, 1.25],
  ["M10 x 1", 10, 1], ["M12 x 1.5", 12, 1.5], ["M12 x 1.25", 12, 1.25],
  ["M14 x 1.5", 14, 1.5], ["M16 x 1.5", 16, 1.5], ["M18 x 1.5", 18, 1.5],
  ["M20 x 1.5", 20, 1.5], ["M24 x 2", 24, 2], ["M30 x 2", 30, 2],
  ["M36 x 3", 36, 3], ["M42 x 3", 42, 3], ["M48 x 3", 48, 3],
];

// ---- General Purpose Acme ----
const ACME_GP: Array<[string, number, number]> = [
  ["1/4-16", 0.25, 16], ["5/16-14", 0.3125, 14], ["3/8-12", 0.375, 12],
  ["7/16-12", 0.4375, 12], ["1/2-10", 0.5, 10], ["5/8-8", 0.625, 8],
  ["3/4-6", 0.75, 6], ["7/8-6", 0.875, 6], ["1-5", 1.0, 5],
  ["1 1/8-5", 1.125, 5], ["1 1/4-5", 1.25, 5], ["1 3/8-4", 1.375, 4],
  ["1 1/2-4", 1.5, 4], ["1 3/4-4", 1.75, 4], ["2-4", 2.0, 4],
  ["2 1/4-3", 2.25, 3], ["2 1/2-3", 2.5, 3], ["2 3/4-3", 2.75, 3],
  ["3-2", 3.0, 2], ["3 1/2-2", 3.5, 2], ["4-2", 4.0, 2],
];

// ---- Whitworth BSW (coarse) — BS 84 ----
const BSW: Array<[string, number, number]> = [
  ["1/8-40", 0.125, 40], ["3/16-24", 0.1875, 24], ["1/4-20", 0.25, 20],
  ["5/16-18", 0.3125, 18], ["3/8-16", 0.375, 16], ["7/16-14", 0.4375, 14],
  ["1/2-12", 0.5, 12], ["9/16-12", 0.5625, 12], ["5/8-11", 0.625, 11],
  ["3/4-10", 0.75, 10], ["7/8-9", 0.875, 9], ["1-8", 1.0, 8],
  ["1 1/8-7", 1.125, 7], ["1 1/4-7", 1.25, 7], ["1 1/2-6", 1.5, 6], ["2-4.5", 2.0, 4.5],
];

// ---- Whitworth BSF (fine) — BS 84 ----
const BSF: Array<[string, number, number]> = [
  ["3/16-32", 0.1875, 32], ["1/4-26", 0.25, 26], ["5/16-22", 0.3125, 22],
  ["3/8-20", 0.375, 20], ["7/16-18", 0.4375, 18], ["1/2-16", 0.5, 16],
  ["9/16-16", 0.5625, 16], ["5/8-14", 0.625, 14], ["3/4-12", 0.75, 12],
  ["7/8-11", 0.875, 11], ["1-10", 1.0, 10],
];

// ---- ISO Metric Trapezoidal Tr (D, pitch mm) — ISO 2901 ----
const TRAP: Array<[string, number, number]> = [
  ["Tr8×1.5", 8, 1.5], ["Tr10×2", 10, 2], ["Tr12×3", 12, 3], ["Tr16×4", 16, 4],
  ["Tr20×4", 20, 4], ["Tr24×5", 24, 5], ["Tr28×5", 28, 5], ["Tr30×6", 30, 6],
  ["Tr36×6", 36, 6], ["Tr40×7", 40, 7], ["Tr44×7", 44, 7], ["Tr48×8", 48, 8],
  ["Tr60×9", 60, 9], ["Tr80×10", 80, 10],
];

// ---- US Buttress 7×45 — ASME B1.9 (D, TPI) ----
const BUTTRESS_US: Array<[string, number, number]> = [
  ["1/2-20", 0.5, 20], ["3/4-16", 0.75, 16], ["1-16", 1.0, 16], ["1 1/2-10", 1.5, 10],
  ["2-8", 2.0, 8], ["3-6", 3.0, 6], ["4-6", 4.0, 6], ["6-4", 6.0, 4],
];

// ---- American pipe NPT/NPSM (nominal: OD, TPI) — ASME B1.20.1 ----
const NPT_SIZES: Array<[string, number, number]> = [
  ["1/16", 0.3125, 27], ["1/8", 0.405, 27], ["1/4", 0.54, 18], ["3/8", 0.675, 18],
  ["1/2", 0.84, 14], ["3/4", 1.05, 14], ["1", 1.315, 11.5], ["1 1/4", 1.66, 11.5],
  ["1 1/2", 1.9, 11.5], ["2", 2.375, 11.5], ["2 1/2", 2.875, 8], ["3", 3.5, 8], ["4", 4.5, 8],
];

// ---- ISO pipe BSPP/BSPT (nominal: OD, TPI) — ISO 7-1 ----
const BSP_SIZES: Array<[string, number, number]> = [
  ["1/8", 0.383, 28], ["1/4", 0.518, 19], ["3/8", 0.656, 19], ["1/2", 0.825, 14],
  ["3/4", 1.041, 14], ["1", 1.309, 11], ["1 1/4", 1.65, 11], ["1 1/2", 1.882, 11],
  ["2", 2.347, 11], ["2 1/2", 2.96, 11], ["3", 3.46, 11],
];

// ---- Unified Miniature UNM (mm: major, pitch) — ASME B1.10 ----
const UNM_SIZES: Array<[string, number, number]> = [
  ["0.30 UNM", 0.3, 0.08], ["0.35 UNM", 0.35, 0.09], ["0.40 UNM", 0.4, 0.1],
  ["0.45 UNM", 0.45, 0.1], ["0.50 UNM", 0.5, 0.125], ["0.55 UNM", 0.55, 0.125],
  ["0.60 UNM", 0.6, 0.15], ["0.70 UNM", 0.7, 0.175], ["0.80 UNM", 0.8, 0.2],
  ["0.90 UNM", 0.9, 0.225], ["1.00 UNM", 1.0, 0.25], ["1.10 UNM", 1.1, 0.25],
  ["1.20 UNM", 1.2, 0.25], ["1.40 UNM", 1.4, 0.3],
];

// ---- Metric conduit Pg (DIN 40430) (D, pitch mm) ----
const PG_SIZES: Array<[string, number, number]> = [
  ["Pg7", 12.5, 1.27], ["Pg9", 15.2, 1.41], ["Pg11", 18.6, 1.41], ["Pg13.5", 20.4, 1.41],
  ["Pg16", 22.5, 1.41], ["Pg21", 28.3, 1.59], ["Pg29", 37.0, 1.59], ["Pg36", 47.0, 1.59],
];

function inchEntries(
  family: ThreadFamily,
  series: string,
  rows: Array<[string, number, number]>,
): CatalogEntry[] {
  return rows.map(([label, majorDiameter, tpi]) => ({
    family,
    label: `${label} ${series}`.trim(),
    majorDiameter,
    tpi,
    series,
  }));
}

function metricEntries(series: string, rows: Array<[string, number, number]>): CatalogEntry[] {
  return metricFamilyEntries("M", series, rows);
}

function metricFamilyEntries(
  family: ThreadFamily,
  series: string,
  rows: Array<[string, number, number]>,
): CatalogEntry[] {
  return rows.map(([label, majorDiameter, pitch]) => ({ family, label, majorDiameter, pitch, series }));
}

function pipeEntries(family: ThreadFamily, prefix: string, rows: Array<[string, number, number]>): CatalogEntry[] {
  return rows.map(([label, majorDiameter, tpi]) => ({
    family,
    label: `${prefix}${label}`,
    majorDiameter,
    tpi,
    series: prefix.trim(),
  }));
}

export const CATALOG: CatalogEntry[] = [
  ...inchEntries("UN", "UNC", UNC),
  ...inchEntries("UN", "UNF", UNF),
  ...inchEntries("UN", "UNEF", UNEF),
  ...metricEntries("coarse", M_COARSE),
  ...metricEntries("fine", M_FINE),
  ...ACME_GP.map(([label, majorDiameter, tpi]) => ({
    family: "ACME" as ThreadFamily,
    label: `${label} Acme`,
    majorDiameter,
    tpi,
    series: "GP",
  })),
  ...inchEntries("WHITWORTH", "BSW", BSW),
  ...inchEntries("WHITWORTH", "BSF", BSF),
  ...metricFamilyEntries("TRAPEZOIDAL", "Tr", TRAP),
  ...inchEntries("BUTTRESS", "7×45", BUTTRESS_US),
  ...pipeEntries("NPT", "NPT ", NPT_SIZES),
  ...pipeEntries("NPTF", "NPTF ", NPT_SIZES),
  ...pipeEntries("NPSM", "NPSM ", NPT_SIZES),
  ...pipeEntries("NPSL", "NPSL ", NPT_SIZES),
  ...pipeEntries("BSPT", "R ", BSP_SIZES),
  ...pipeEntries("BSPP", "G ", BSP_SIZES),
  ...metricFamilyEntries("UNM", "UNM", UNM_SIZES),
  ...metricFamilyEntries("PG_CONDUIT", "Pg", PG_SIZES),
];

/** Catalog grouped by family for building UI dropdowns. */
export function catalogByFamily(): Map<ThreadFamily, CatalogEntry[]> {
  const m = new Map<ThreadFamily, CatalogEntry[]>();
  for (const e of CATALOG) {
    const arr = m.get(e.family) ?? [];
    arr.push(e);
    m.set(e.family, arr);
  }
  return m;
}
