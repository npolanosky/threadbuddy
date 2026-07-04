import { describe, it, expect } from "vitest";
import { calculate } from "../src/index.js";
import { STI_UN_LIMITS, STI_M_LIMITS } from "../src/data/sti.js";

/**
 * STI (Screw Thread Insert / Heli-Coil) tapped-hole verification.
 *
 * Anchors are the published limits of ASME B18.29.1 (inch) and ASME B18.29.2M (metric),
 * cross-verified against the Stanley Heli-Coil HC-2000 catalog. The tapped hole is an enlarged
 * UN/M internal thread: D' = D_nominal + 1.299038 p.
 */

const OFF = 1.299038; // enlargement coefficient (2 * 0.6495190528)

describe("STI Unified (STI_UN) — ASME B18.29.1", () => {
  it("1/4-20 STI internal (2B) matches the published tapped-hole limits", () => {
    const r = calculate({ family: "STI_UN", majorDiameter: 0.25, tpi: 20, classOfFit: "2B" });
    expect(r.majorDiameter.internal!.min).toBeCloseTo(0.315, 4);
    expect(r.pitchDiameter.internal!.min).toBeCloseTo(0.2825, 4);
    expect(r.pitchDiameter.internal!.max).toBeCloseTo(0.2864, 4); // 2B
    expect(r.minorDiameter.internal!.min).toBeCloseTo(0.2608, 4);
    expect(r.minorDiameter.internal!.max).toBeCloseTo(0.2704, 4);
  });

  it("1/4-20 STI class 3B uses the tighter pitch max (0.2851)", () => {
    const r = calculate({ family: "STI_UN", majorDiameter: 0.25, tpi: 20, classOfFit: "3B" });
    expect(r.pitchDiameter.internal!.max).toBeCloseTo(0.2851, 4);
  });

  it("designation keeps the nominal size, not the enlarged diameter", () => {
    const r = calculate({ family: "STI_UN", majorDiameter: 0.25, tpi: 20, classOfFit: "2B" });
    expect(r.designation.startsWith("0.2500-20")).toBe(true);
  });

  it("STI hole diameters are strictly larger than the same-size standard UN thread", () => {
    const un = calculate({ family: "UN", majorDiameter: 0.25, tpi: 20, classOfFit: "2B" });
    const sti = calculate({ family: "STI_UN", majorDiameter: 0.25, tpi: 20, classOfFit: "2B" });
    expect(sti.pitchDiameter.internal!.min).toBeGreaterThan(un.pitchDiameter.internal!.min);
    expect(sti.minorDiameter.internal!.min).toBeGreaterThan(un.minorDiameter.internal!.min);
    expect(sti.majorDiameter.internal!.min).toBeGreaterThan(un.majorDiameter.internal!.min);
  });

  it("STI tap-drill target lands inside the STI minor range (not the standard hole)", () => {
    const r = calculate({ family: "STI_UN", majorDiameter: 0.25, tpi: 20, classOfFit: "2B" });
    // Theoretical 75% hole must sit between STI minor min/max (17/64 = 0.2656 territory).
    expect(r.tapDrill!).toBeGreaterThan(0.2608);
    expect(r.tapDrill!).toBeLessThan(0.2704);
  });

  it("every catalogued STI_UN row's basic dims equal the D' formula", () => {
    for (const lim of STI_UN_LIMITS) {
      const p = 1 / lim.size;
      expect(lim.majorMin).toBeCloseTo(lim.nominal + OFF * p, 3);
      expect(lim.pitchMin).toBeCloseTo(lim.nominal + 0.649519 * p, 3);
      expect(lim.minorMin).toBeCloseTo(lim.nominal + 0.216506 * p, 3);
      // Tighter class max must not exceed the looser class max.
      expect(lim.pitchMaxTight).toBeLessThanOrEqual(lim.pitchMaxLoose);
    }
  });

  it("#12-24 UNC STI (newly catalogued) matches the published tapped-hole limits", () => {
    const r = calculate({ family: "STI_UN", majorDiameter: 0.216, tpi: 24, classOfFit: "3B" });
    expect(r.majorDiameter.internal!.min).toBeCloseTo(0.2701, 4);
    expect(r.pitchDiameter.internal!.min).toBeCloseTo(0.243, 4);
    expect(r.pitchDiameter.internal!.max).toBeCloseTo(0.2453, 4); // 3B
    expect(r.minorDiameter.internal!.min).toBeCloseTo(0.225, 4);
    expect(r.minorDiameter.internal!.max).toBeCloseTo(0.234, 4);
    const lim = STI_UN_LIMITS.find((l) => l.nominal === 0.216 && l.size === 24)!;
    expect(lim.tapDrillName).toBe("#1");
  });

  it("3/8-24 UNF STI (newly catalogued) matches the published tapped-hole limits", () => {
    const r = calculate({ family: "STI_UN", majorDiameter: 0.375, tpi: 24, classOfFit: "3B" });
    expect(r.majorDiameter.internal!.min).toBeCloseTo(0.4291, 4);
    expect(r.pitchDiameter.internal!.min).toBeCloseTo(0.402, 4);
    expect(r.pitchDiameter.internal!.max).toBeCloseTo(0.4047, 4); // 3B
    expect(r.minorDiameter.internal!.min).toBeCloseTo(0.384, 4);
    expect(r.minorDiameter.internal!.max).toBeCloseTo(0.391, 4);
    // 3/8-24 UNF uses drill 25/64, distinct from 3/8-16 UNC.
    const lim = STI_UN_LIMITS.find((l) => l.nominal === 0.375 && l.size === 24)!;
    expect(lim.tapDrillName).toBe("25/64");
  });
});

describe("STI Metric (STI_M) — ASME B18.29.2M", () => {
  it("M6 x 1 STI internal (5H) matches the published tapped-hole limits", () => {
    const r = calculate({ family: "STI_M", majorDiameter: 6, pitch: 1, classOfFit: "5H" });
    expect(r.majorDiameter.internal!.min).toBeCloseTo(7.299, 3);
    expect(r.pitchDiameter.internal!.min).toBeCloseTo(6.65, 3);
    expect(r.pitchDiameter.internal!.max).toBeCloseTo(6.742, 3); // 5H
    expect(r.minorDiameter.internal!.min).toBeCloseTo(6.217, 3);
    expect(r.minorDiameter.internal!.max).toBeCloseTo(6.407, 3);
  });

  it("M6 x 1 class 4H5H uses the tighter pitch max (6.719)", () => {
    const r = calculate({ family: "STI_M", majorDiameter: 6, pitch: 1, classOfFit: "4H5H" });
    expect(r.pitchDiameter.internal!.max).toBeCloseTo(6.719, 3);
  });

  it("STI hole diameters are strictly larger than the same-size standard M thread", () => {
    const m = calculate({ family: "M", majorDiameter: 6, pitch: 1, classOfFit: "6H" });
    const sti = calculate({ family: "STI_M", majorDiameter: 6, pitch: 1, classOfFit: "5H" });
    expect(sti.pitchDiameter.internal!.min).toBeGreaterThan(m.pitchDiameter.internal!.min);
    expect(sti.minorDiameter.internal!.min).toBeGreaterThan(m.minorDiameter.internal!.min);
  });

  it("designation keeps the nominal size (M6×1), not the enlarged diameter", () => {
    const r = calculate({ family: "STI_M", majorDiameter: 6, pitch: 1, classOfFit: "5H" });
    expect(r.designation.startsWith("M6×1")).toBe(true);
  });

  it("every catalogued STI_M row's basic dims equal the D' formula", () => {
    for (const lim of STI_M_LIMITS) {
      const P = lim.size;
      expect(lim.majorMin).toBeCloseTo(lim.nominal + OFF * P, 2);
      expect(lim.pitchMin).toBeCloseTo(lim.nominal + 0.649519 * P, 2);
      expect(lim.minorMin).toBeCloseTo(lim.nominal + 0.216506 * P, 2);
      expect(lim.pitchMaxTight).toBeLessThanOrEqual(lim.pitchMaxLoose);
    }
  });

  it("M18 x 2.5 STI (newly catalogued) matches the published tapped-hole limits", () => {
    const r = calculate({ family: "STI_M", majorDiameter: 18, pitch: 2.5, classOfFit: "4H5H" });
    expect(r.majorDiameter.internal!.min).toBeCloseTo(21.2476, 3);
    expect(r.pitchDiameter.internal!.min).toBeCloseTo(19.624, 3);
    expect(r.pitchDiameter.internal!.max).toBeCloseTo(19.738, 3); // 4H5H
    expect(r.minorDiameter.internal!.min).toBeCloseTo(18.541, 3);
    expect(r.minorDiameter.internal!.max).toBeCloseTo(18.896, 3);
  });

  it("resolves the M3 x 0.5 minorMax conflict to the formula-consistent 3.220", () => {
    const lim = STI_M_LIMITS.find((l) => l.nominal === 3 && l.size === 0.5)!;
    expect(lim.minorMax).toBeCloseTo(3.22, 3);
    // Formula check: internal minor max = minorMin + 4H tolerance allowance (~0.112).
    expect(lim.minorMax).toBeCloseTo(lim.minorMin + 0.112, 3);
  });
});
