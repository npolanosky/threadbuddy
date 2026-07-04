/**
 * STI (Screw Thread Insert / helical-coil, "Heli-Coil") tapped-hole limit tables.
 *
 * An STI tapped hole is a Unified/Metric internal thread of the SAME pitch as the nominal screw,
 * but with the basic diameters ENLARGED to accept the insert wire cross-section:
 *
 *   basic major  D' = D_nominal + 1.299038*p   (= D + 1.5H)
 *   basic pitch     = D_nominal + 0.649519*p
 *   basic minor     = D_nominal + 0.216506*p
 *
 * The basic dimensions fall out exactly from the standard UN/M formulas evaluated at D' (see
 * deriveUN / deriveMetric). The tolerance SPREADS, however, do not follow the standard 2B/6H
 * tolerance factors, so the limit values below are stored verbatim from the governing standards
 * rather than computed:
 *
 *   Inch  — ASME B18.29.1 (Unified, classes 2B and 3B). Cross-verified against the Stanley
 *           Heli-Coil HC-2000 catalog Table VII and AmesWeb's B18.29.1 table (agree to 0.0001").
 *   Metric — ASME B18.29.2M (classes 5H ~ 2B and 4H5H ~ 3B), from HC-2000 Table VIII.
 *
 * Every row's majorMin / pitchMin / minorMin also equals the D' formula to the last published
 * decimal (checked in engine/tests/sti.test.ts).
 *
 * `pitchMaxLoose` = class 2B (inch) / 5H (metric); `pitchMaxTight` = class 3B / 4H5H.
 */

export interface StiLimits {
  /** Nominal major diameter of the screw the insert serves (native units: inch or mm). */
  nominal: number;
  /** tpi for Unified STI; pitch (mm) for metric STI. */
  size: number;
  /** Enlarged basic major diameter D' of the tapped hole (min = basic). */
  majorMin: number;
  /** Tapped-hole pitch diameter minimum (basic). */
  pitchMin: number;
  /** Pitch-diameter maximum for the tighter class (3B / 4H5H). */
  pitchMaxTight: number;
  /** Pitch-diameter maximum for the looser class (2B / 5H). */
  pitchMaxLoose: number;
  /** Tapped-hole minor diameter (after tapping) minimum and maximum. */
  minorMin: number;
  minorMax: number;
  /**
   * Enlarged basic major-diameter MAXIMUM (published), where the governing table gives it.
   * Optional because the original rows were stored with the basic min only; newer rows carry it.
   */
  majorMax?: number;
  /** Recommended STI tap-drill designation (drill number / letter / fraction / metric). */
  tapDrillName?: string;
  /** Decimal size (inch for STI_UN, mm for STI_M) of `tapDrillName`. */
  tapDrillDecimal?: number;
  /** Smaller alternate tap drill recommended for soft/ductile stock (e.g. aluminum). */
  altDrillAluminum?: { name: string; decimal: number };
  /** Internal thread class of the tapped hole (STI holes here are 3B / 4H5H). */
  threadClass?: string;
}

/** Auxiliary per-row data carried in the optional trailing tuple slot. */
type RowExtra = {
  majorMax?: number;
  tapDrillName?: string;
  tapDrillDecimal?: number;
  altDrillAluminum?: { name: string; decimal: number };
  threadClass?: string;
};

// [nominal, size(tpi), majorMin, pitchMin, pitchMaxTight(3B), pitchMaxLoose(2B), minorMin, minorMax, extra?]
type Row = [number, number, number, number, number, number, number, number, RowExtra?];

// Tap-drill designations (`tapDrillName` / `altDrillAluminum`) and `majorMax` are populated from the
// Heli-Coil HC-2000 drilling data wherever the source publishes them. Older UNC rows carry only the
// numeric limits they were originally stored with; their drill designations are not fabricated here.
const STI_UN_ROWS: Row[] = [
  // UNC
  [0.112, 40, 0.1445, 0.1283, 0.1299, 0.1308, 0.1175, 0.1252], // #4-40
  [0.125, 40, 0.1575, 0.1413, 0.143, 0.1438, 0.1305, 0.1373, { majorMax: 0.1603, tapDrillName: "#29", tapDrillDecimal: 0.136, altDrillAluminum: { name: "3.4mm", decimal: 0.1339 }, threadClass: "3B" }], // #5-40
  [0.138, 32, 0.1786, 0.1583, 0.1601, 0.1611, 0.1448, 0.1527], // #6-32
  [0.164, 32, 0.2046, 0.1843, 0.1862, 0.1872, 0.1708, 0.1781], // #8-32
  [0.19, 24, 0.2441, 0.217, 0.2192, 0.2203, 0.199, 0.208], // #10-24
  [0.216, 24, 0.2701, 0.243, 0.2453, 0.2464, 0.225, 0.234, { majorMax: 0.2735, tapDrillName: "#1", tapDrillDecimal: 0.228, threadClass: "3B" }], // #12-24
  [0.25, 20, 0.315, 0.2825, 0.2851, 0.2864, 0.2608, 0.2704], // 1/4-20
  [0.3125, 18, 0.3847, 0.3486, 0.3515, 0.3529, 0.3245, 0.3342], // 5/16-18
  [0.375, 16, 0.4562, 0.4156, 0.4189, 0.4203, 0.3885, 0.3987], // 3/8-16
  [0.4375, 14, 0.5303, 0.4839, 0.4875, 0.489, 0.453, 0.4639], // 7/16-14
  [0.5, 13, 0.5999, 0.5499, 0.5537, 0.5554, 0.5166, 0.5273], // 1/2-13
  [0.5625, 12, 0.6708, 0.6167, 0.6208, 0.6225, 0.5806, 0.5918], // 9/16-12
  [0.625, 11, 0.7431, 0.6841, 0.6885, 0.6903, 0.6447, 0.6564], // 5/8-11
  [0.75, 10, 0.8799, 0.8149, 0.8196, 0.8216, 0.7716, 0.7838], // 3/4-10
  [0.875, 9, 1.0193, 0.9471, 0.9522, 0.9543, 0.899, 0.9119], // 7/8-9
  [1.0, 8, 1.1624, 1.0812, 1.0868, 1.089, 1.0271, 1.0421], // 1-8
  // UNF
  [0.112, 48, 0.1391, 0.1256, 0.1271, 0.1279, 0.1166, 0.1229, { majorMax: 0.1419, tapDrillName: "#31", tapDrillDecimal: 0.12, altDrillAluminum: { name: "3mm", decimal: 0.1181 }, threadClass: "3B" }], // #4-48
  [0.138, 40, 0.1705, 0.1543, 0.156, 0.1569, 0.1435, 0.1503, { majorMax: 0.1733, tapDrillName: "#25", tapDrillDecimal: 0.1495, altDrillAluminum: { name: "#26", decimal: 0.147 }, threadClass: "3B" }], // #6-40
  [0.164, 36, 0.2001, 0.1821, 0.184, 0.1849, 0.1701, 0.1771, { majorMax: 0.2032, tapDrillName: "#16", tapDrillDecimal: 0.177, altDrillAluminum: { name: "#17", decimal: 0.173 }, threadClass: "3B" }], // #8-36
  [0.19, 32, 0.2306, 0.2103, 0.2123, 0.2133, 0.1968, 0.2041, { majorMax: 0.2337, tapDrillName: "13/64", tapDrillDecimal: 0.2031, altDrillAluminum: { name: "#7", decimal: 0.201 }, threadClass: "3B" }], // #10-32
  [0.25, 28, 0.2964, 0.2732, 0.2754, 0.2765, 0.2577, 0.2646, { majorMax: 0.2995, tapDrillName: "6.7mm", tapDrillDecimal: 0.2638, altDrillAluminum: { name: "G", decimal: 0.261 }, threadClass: "3B" }], // 1/4-28
  [0.3125, 24, 0.3666, 0.3395, 0.3421, 0.3433, 0.3215, 0.3288, { majorMax: 0.37, tapDrillName: "21/64", tapDrillDecimal: 0.3281, threadClass: "3B" }], // 5/16-24
  [0.375, 24, 0.4291, 0.402, 0.4047, 0.4059, 0.384, 0.391, { majorMax: 0.4325, tapDrillName: "25/64", tapDrillDecimal: 0.3906, threadClass: "3B" }], // 3/8-24
  [0.4375, 20, 0.5025, 0.47, 0.4731, 0.4744, 0.4483, 0.4561, { majorMax: 0.5062, tapDrillName: "29/64", tapDrillDecimal: 0.4531, threadClass: "3B" }], // 7/16-20
  [0.5, 20, 0.565, 0.5325, 0.5357, 0.5371, 0.5108, 0.5186, { majorMax: 0.5687, tapDrillName: "33/64", tapDrillDecimal: 0.5156, threadClass: "3B" }], // 1/2-20
  [0.5625, 18, 0.6347, 0.5986, 0.602, 0.6035, 0.5745, 0.5826, { majorMax: 0.6384, tapDrillName: "37/64", tapDrillDecimal: 0.5781, threadClass: "3B" }], // 9/16-18
  [0.625, 18, 0.6972, 0.6611, 0.6646, 0.6661, 0.637, 0.6451, { majorMax: 0.7009, tapDrillName: "41/64", tapDrillDecimal: 0.6406, threadClass: "3B" }], // 5/8-18
  [0.75, 16, 0.8312, 0.7906, 0.7945, 0.7961, 0.7635, 0.772, { majorMax: 0.8352, tapDrillName: "49/64", tapDrillDecimal: 0.7656, threadClass: "3B" }], // 3/4-16
  [0.875, 14, 0.9678, 0.9214, 0.9257, 0.9274, 0.8905, 0.8994, { majorMax: 0.9718, tapDrillName: "57/64", tapDrillDecimal: 0.8906, threadClass: "3B" }], // 7/8-14
  [1.0, 12, 1.1083, 1.0542, 1.0589, 1.0608, 1.0181, 1.0281, { majorMax: 1.1126, tapDrillName: "1-1/32", tapDrillDecimal: 1.0312, altDrillAluminum: { name: "1-1/64", decimal: 1.0156 }, threadClass: "3B" }], // 1-12
];

// [nominal, size(pitch mm), majorMin, pitchMin, pitchMaxTight(4H5H), pitchMaxLoose(5H), minorMin, minorMax]
//
// M3 / M4 / M5 minorMax conflict resolution (see Step 6 of the completion task):
//   Two candidate sets existed — {3.248, 4.332, 5.374} vs the Vargus/HC-2000 PDF {3.220, 4.292, 5.334}.
//   The 60°-thread internal minor max is minorMax ≈ majorMin − 1.082532·p + tolAllowance (ISO 965-1),
//   which for the internal minor equals minorMin + tolAllowance. With the published 4H allowances
//   (≈0.112 M3, 0.140 M4, 0.160 M5):
//       M3: 3.108 + 0.112 = 3.220   M4: 4.152 + 0.140 = 4.292   M5: 5.174 + 0.160 = 5.334
//   Every one matches the Vargus PDF set to the last decimal; the {3.248,4.332,5.374} set overshoots
//   by 0.028–0.040 mm. Kept the formula-consistent Vargus HC-2000 values below.
const STI_M_ROWS: Row[] = [
  [3, 0.5, 3.6495, 3.325, 3.367, 3.384, 3.108, 3.22], // M3 x 0.5  (minorMax 3.220 — see note above)
  [3.5, 0.6, 4.2794, 3.89, 3.94, 3.959, 3.63, 3.79], // M3.5 x 0.6
  [4, 0.7, 4.9093, 4.455, 4.509, 4.529, 4.152, 4.292], // M4 x 0.7  (minorMax 4.292 — see note above)
  [5, 0.8, 6.0392, 5.52, 5.577, 5.597, 5.174, 5.334], // M5 x 0.8  (minorMax 5.334 — see note above)
  [6, 1, 7.299, 6.65, 6.719, 6.742, 6.217, 6.407], // M6 x 1
  [8, 1.25, 9.6238, 8.812, 8.886, 8.911, 8.271, 8.483], // M8 x 1.25
  [10, 1.5, 11.9486, 10.974, 11.061, 11.089, 10.324, 10.56], // M10 x 1.5
  [12, 1.75, 14.2733, 13.137, 13.236, 13.271, 12.379, 12.644], // M12 x 1.75
  [14, 2, 16.5981, 15.299, 15.406, 15.444, 14.433, 14.733], // M14 x 2
  [16, 2, 18.5981, 17.299, 17.406, 17.444, 16.433, 16.733], // M16 x 2
  // M18/M22 share pitch 2.5 and the same 11.2–22.4 mm diameter range as M20, so their 4H5H/5H pitch
  // tolerance spread (tight = pitchMin+0.114, loose = pitchMin+0.154) is identical to M20 x 2.5.
  [18, 2.5, 21.2476, 19.624, 19.738, 19.778, 18.541, 18.896, { tapDrillName: "18.75mm", tapDrillDecimal: 18.75, threadClass: "4H5H" }], // M18 x 2.5
  [20, 2.5, 23.2476, 21.624, 21.738, 21.778, 20.541, 20.896], // M20 x 2.5
  [22, 2.5, 25.2476, 23.624, 23.738, 23.778, 22.541, 22.896, { tapDrillName: "22.75mm", tapDrillDecimal: 22.75, threadClass: "4H5H" }], // M22 x 2.5
  [24, 3, 27.8971, 25.948, 26.093, 26.135, 24.649, 25.049], // M24 x 3
];

function toTable(rows: Row[]): StiLimits[] {
  return rows.map(
    ([nominal, size, majorMin, pitchMin, pitchMaxTight, pitchMaxLoose, minorMin, minorMax, extra]) => ({
      nominal,
      size,
      majorMin,
      pitchMin,
      pitchMaxTight,
      pitchMaxLoose,
      minorMin,
      minorMax,
      ...extra,
    }),
  );
}

export const STI_UN_LIMITS: StiLimits[] = toTable(STI_UN_ROWS);
export const STI_M_LIMITS: StiLimits[] = toTable(STI_M_ROWS);

/**
 * Look up the STI tapped-hole limits for a nominal size.
 * @param family  "STI_UN" (size = tpi) or "STI_M" (size = pitch mm).
 * @param nominal nominal screw major diameter (native units).
 * @param size    tpi for STI_UN, pitch (mm) for STI_M.
 */
export function stiLimitsFor(
  family: "STI_UN" | "STI_M",
  nominal: number,
  size: number,
): StiLimits | undefined {
  const table = family === "STI_UN" ? STI_UN_LIMITS : STI_M_LIMITS;
  return table.find((r) => Math.abs(r.nominal - nominal) < 5e-4 && Math.abs(r.size - size) < 5e-3);
}
