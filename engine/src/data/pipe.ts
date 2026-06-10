/**
 * ASME B1.20.1 NPT taper-pipe engagement lengths (authoritative table values).
 * Keyed by [outside diameter, threads-per-inch]. E0/E1 pitch diameters are computed from these
 * via the B1.20.1 formulas (validated against the published 1/16-27 row).
 *
 * Columns: D (OD, in), n (TPI), L1 hand-tight, L2 effective, L4 overall external thread length.
 * Source: ASME B1.20.1 (NPT), as tabulated by published thread-data references.
 */

export interface NptLengths {
  D: number;
  n: number;
  L1: number;
  L2: number;
  L4: number;
}

export const NPT_LENGTHS: NptLengths[] = [
  { D: 0.3125, n: 27, L1: 0.16, L2: 0.2611, L4: 0.2875 },
  { D: 0.405, n: 27, L1: 0.1615, L2: 0.2639, L4: 0.38 },
  { D: 0.54, n: 18, L1: 0.2278, L2: 0.4018, L4: 0.5025 },
  { D: 0.675, n: 18, L1: 0.24, L2: 0.4078, L4: 0.6375 },
  { D: 0.84, n: 14, L1: 0.32, L2: 0.5337, L4: 0.79179 },
  { D: 1.05, n: 14, L1: 0.339, L2: 0.5457, L4: 1.00179 },
  { D: 1.315, n: 11.5, L1: 0.4, L2: 0.6828, L4: 1.2563 },
  { D: 1.66, n: 11.5, L1: 0.42, L2: 0.7068, L4: 1.6013 },
  { D: 1.9, n: 11.5, L1: 0.42, L2: 0.7235, L4: 1.8413 },
  { D: 2.375, n: 11.5, L1: 0.436, L2: 0.7565, L4: 2.3163 },
  { D: 2.875, n: 8, L1: 0.682, L2: 1.1375, L4: 2.79062 },
  { D: 3.5, n: 8, L1: 0.766, L2: 1.2, L4: 3.41562 },
  { D: 4.5, n: 8, L1: 0.844, L2: 1.3, L4: 4.41562 },
];

/** Find the NPT length row for a given OD and TPI (tolerant match), or undefined. */
export function lookupNptLengths(D: number, n: number): NptLengths | undefined {
  return NPT_LENGTHS.find((r) => Math.abs(r.D - D) < 0.002 && Math.abs(r.n - n) < 0.01);
}
